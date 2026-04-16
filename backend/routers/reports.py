from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
import auth, models
import pandas as pd
from typing import List, Optional
from pydantic import BaseModel
import io
from fastapi.responses import StreamingResponse
from datetime import datetime
from dateutil.relativedelta import relativedelta
from utils.email_sender import send_excel_report_email

router = APIRouter()

# Memory cache to make ABC Analysis instant after the first load
ABC_CACHE = {"df": None, "timestamp": None}
CACHE_SECONDS = 900 # 15 minutes

class MonthlyCloseFilters(BaseModel):
    exercise: int
    period: int

def map_division(fam):
    fam = str(fam).strip().upper()
    if fam == 'M': return 'Mecánica'
    elif fam == 'C': return 'Conectrónica'
    elif fam == 'I': return 'Informática Industrial'
    return None # Exclude everything else (Estructura, Otros, etc.)


@router.post("/monthly-close")
def get_monthly_close(filters: MonthlyCloseFilters, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    def check_is_authorized(u):
        r_name = str(u.role).lower()
        ro_name = str(u.role_obj.name).lower() if u.role_obj else ""
        
        is_adm = "admin" in r_name or "admin" in ro_name
        is_dir = "direcci" in r_name or "direcci" in ro_name or "direccion" in r_name or "direccion" in ro_name
        return is_adm or is_dir

    if not check_is_authorized(current_user):
        raise HTTPException(status_code=403, detail="Not authorized for this report")


    try:
        company_id = 2 # Fixed for Company 2
        exercise = filters.exercise
        period = filters.period

        # 1. Facturación (Albaranes Facturados)
        # First, define what families are valid for filtering
        valid_families = ('M', 'C', 'I')
        
        # Query total and division breakdown from LINES to ensure family filtering
        q_fact_lines = """
            SELECT CodigoFamilia, SerieFactura, NumeroFactura, SUM(BaseImponible) as Total
            FROM CEN_PowerBI_LineasAlbaranesFacturadosSinDuplicados WITH (NOLOCK)
            WHERE CodigoEmpresa = 2 
              AND EjercicioFactura = :ex 
              AND MONTH(FechaFactura) = :per
            GROUP BY CodigoFamilia, SerieFactura, NumeroFactura
        """
        lines_df = pd.read_sql(text(q_fact_lines), db.bind, params={"ex": exercise, "per": period})
        lines_df['Division'] = lines_df['CodigoFamilia'].apply(map_division)
        
        # Valid orders are those whose division is one of Mecánica, Conectrónica, Informática
        valid_lines_df = lines_df[lines_df['Division'].notnull()].copy()
        
        facturación_total = float(valid_lines_df['Total'].sum())
        facturación_division = valid_lines_df.groupby('Division')['Total'].sum().to_dict()

        # To get the "REAL" (Header) commercial for these valid orders:
        q_fact_header = """
            SELECT SerieFactura, NumeroFactura, CodigoComisionista, Comisionista, SUM(BaseImponible) as HeaderTotal
            FROM Vis_AEL_DiarioFactxComercial WITH (NOLOCK)
            WHERE CodigoEmpresa = 2 
              AND YEAR(FechaFactura) = :ex 
              AND MONTH(FechaFactura) = :per
            GROUP BY SerieFactura, NumeroFactura, CodigoComisionista, Comisionista
        """
        header_df = pd.read_sql(text(q_fact_header), db.bind, params={"ex": exercise, "per": period})
        
        valid_invoice_keys = valid_lines_df[['SerieFactura', 'NumeroFactura']].drop_duplicates()
        fcom_df = pd.merge(header_df, valid_invoice_keys, on=['SerieFactura', 'NumeroFactura'])
        
        # Filter out rows with no commercial
        fcom_df = fcom_df[fcom_df['CodigoComisionista'].notnull() & fcom_df['Comisionista'].notnull()]
        fcom_df = fcom_df[fcom_df['Comisionista'].str.strip().str.upper() != 'SIN COMERCIAL']
        
        # Format as "ID NAME"
        fcom_df['ComercialLabel'] = fcom_df.apply(lambda r: f"{int(r['CodigoComisionista'])} {str(r['Comisionista']).strip().upper()}", axis=1)
        facturación_comercial = fcom_df.groupby('ComercialLabel')['HeaderTotal'].sum().sort_values(ascending=False).to_dict()

        # 2. Inventario (Total + Divisions)
        q_inventario = """
            SELECT CodigoFamilia, SUM(ImporteSaldo) as Value
            FROM PowerBi_AcumuladoStock WITH (NOLOCK)
            WHERE CodigoEmpresa = 2 AND Ejercicio = :ex AND Periodo = :per
            GROUP BY CodigoFamilia
        """
        inv_df = pd.read_sql(text(q_inventario), db.bind, params={"ex": exercise, "per": period})
        inv_df['Division'] = inv_df['CodigoFamilia'].apply(map_division)
        inv_df = inv_df[inv_df['Division'].notnull()]
        inventario_total = float(inv_df['Value'].sum())
        inventario_division = inv_df.groupby('Division')['Value'].sum().to_dict()

        # 3. Compras (Pedidos Proveedor en el mes)
        q_compras = """
            SELECT SUM(ImporteLiquido) as Total
            FROM CabeceraPedidoProveedor WITH (NOLOCK)
            WHERE CodigoEmpresa = 2
              AND EjercicioPedido = :ex
              AND MONTH(FechaPedido) = :per
        """
        comp_res = db.execute(text(q_compras), {"ex": exercise, "per": period}).fetchone()
        compras_total = float(comp_res[0]) if comp_res and comp_res[0] else 0

        # 4. Ventas (Pedidos Cliente en el mes) - Group by HEADER commercial
        q_ventas = """
            SELECT 
                lin.CodigoFamilia, 
                cab.CodigoComisionista,
                com.Comisionista,
                SUM(lin.ImporteNeto) as Total
            FROM CabeceraPedidoCliente cab WITH (NOLOCK)
            JOIN LineasPedidoCliente lin WITH (NOLOCK) 
              ON cab.CodigoEmpresa = lin.CodigoEmpresa 
              AND cab.EjercicioPedido = lin.EjercicioPedido
              AND cab.SeriePedido = lin.SeriePedido
              AND cab.NumeroPedido = lin.NumeroPedido
            LEFT JOIN Comisionistas com WITH (NOLOCK)
              ON cab.CodigoEmpresa = com.CodigoEmpresa
              AND cab.CodigoComisionista = com.CodigoComisionista
            WHERE cab.CodigoEmpresa = 2
              AND cab.EjercicioPedido = :ex
              AND MONTH(cab.FechaPedido) = :per
            GROUP BY lin.CodigoFamilia, cab.CodigoComisionista, com.Comisionista
        """
        ventas_df = pd.read_sql(text(q_ventas), db.bind, params={"ex": exercise, "per": period})
        ventas_df['Division'] = ventas_df['CodigoFamilia'].apply(map_division)
        ventas_df = ventas_df[ventas_df['Division'].notnull()]
        ventas_total = float(ventas_df['Total'].sum())
        
        # Ventas by Division
        ventas_division = ventas_df.groupby('Division')['Total'].sum().to_dict()
        
        # Ventas by Comercial
        vcom_df = ventas_df[ventas_df['CodigoComisionista'].notnull() & ventas_df['Comisionista'].notnull()].copy()
        vcom_df = vcom_df[vcom_df['Comisionista'].str.strip().str.upper() != 'SIN COMERCIAL']
        vcom_df['ComercialLabel'] = vcom_df.apply(lambda r: f"{int(r['CodigoComisionista'])} {str(r['Comisionista']).strip().upper()}", axis=1)
        ventas_comercial = vcom_df.groupby('ComercialLabel')['Total'].sum().sort_values(ascending=False).to_dict()




        # 5. Cartera (Backlog / Pedidos Pendientes) - Snapshot current
        q_cartera = """
            SELECT lin.CodigoFamilia, SUM(lin.ImporteNetoPendiente) as Total
            FROM LineasPedidoCliente lin WITH (NOLOCK)
            WHERE lin.CodigoEmpresa = 2 AND lin.UnidadesPendientes > 0
            GROUP BY lin.CodigoFamilia
        """
        cartera_df = pd.read_sql(text(q_cartera), db.bind)
        cartera_df['Division'] = cartera_df['CodigoFamilia'].apply(map_division)
        cartera_df = cartera_df[cartera_df['Division'].notnull()]
        cartera_total = float(cartera_df['Total'].sum())
        cartera_division = cartera_df.groupby('Division')['Total'].sum().to_dict()


        # 6. Ventas Específicas (Cataluña y CYME)
        # Cataluña (Barcelona:08, Girona:17, Lleida:25, Tarragona:43)
        q_especificas = """
            SELECT 
                SUM(CASE WHEN cab.CodigoProvincia IN ('08', '17', '25', '43') OR cab.Provincia IN ('BARCELONA', 'GIRONA', 'LLEIDA', 'TARRAGONA') THEN lin.ImporteNeto ELSE 0 END) as Cataluña,
                SUM(CASE WHEN cab.RazonSocial LIKE 'CYME%' THEN lin.ImporteNeto ELSE 0 END) as CYME
            FROM CabeceraPedidoCliente cab WITH (NOLOCK)
            JOIN LineasPedidoCliente lin WITH (NOLOCK) 
              ON cab.CodigoEmpresa = lin.CodigoEmpresa 
              AND cab.EjercicioPedido = lin.EjercicioPedido
              AND cab.SeriePedido = lin.SeriePedido
              AND cab.NumeroPedido = lin.NumeroPedido
            WHERE cab.CodigoEmpresa = 2
              AND cab.EjercicioPedido = :ex
              AND MONTH(cab.FechaPedido) = :per
        """
        espec_res = db.execute(text(q_especificas), {"ex": exercise, "per": period}).fetchone()
        ventas_catalunya = float(espec_res[0]) if espec_res and espec_res[0] else 0
        ventas_cyme = float(espec_res[1]) if espec_res and espec_res[1] else 0

        return {
            "facturación": {
                "total": facturación_total,
                "por_division": facturación_division,
                "por_comercial": facturación_comercial
            },
            "inventario": {
                "total": inventario_total,
                "por_division": inventario_division
            },
            "compras": compras_total,
            "ventas": {
                "total": ventas_total,
                "por_division": ventas_division,
                "por_comercial": ventas_comercial,
                "catalunya": ventas_catalunya,
                "cyme": ventas_cyme
            },
            "cartera": {
                "total": cartera_total,
                "por_division": cartera_division
            }
        }

    except Exception as e:
        print(f"Error in monthly close report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/item-rotation")
def get_item_rotation_report(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    try:
        # 1. Define date range (last 18 months)
        end_date = datetime.now()
        start_date = (end_date - relativedelta(months=18)).replace(day=1)
        
        # 2. Query data
        # We include Company 2 and 100 to cover the 18-month span (2025+ is Co 2, before was Co 100)
        query = """
            SELECT 
                RTRIM(LTRIM(CodigoArticulo)) as CodigoArticulo, 
                MAX(DescripcionArticulo) as Descripcion,
                YEAR(FechaAlbaran) as Anio,
                MONTH(FechaAlbaran) as Mes,
                SUM(Unidades) as Unidades,
                COUNT(DISTINCT CONCAT(SerieAlbaran, NumeroAlbaran, EjercicioAlbaran)) as Albaranes
            FROM LineasAlbaranCliente WITH (NOLOCK)
            WHERE FechaAlbaran >= :start_dt
              AND CodigoEmpresa = 2
              AND RTRIM(LTRIM(CodigoArticulo)) NOT IN ('', '.')
            GROUP BY RTRIM(LTRIM(CodigoArticulo)), YEAR(FechaAlbaran), MONTH(FechaAlbaran)
        """
        
        df = pd.read_sql(text(query), db.bind, params={"start_dt": start_date})
        
        if df.empty:
            raise HTTPException(status_code=404, detail="No data found for the last 18 months")

        # 3. Process months nomenclature
        meses_es = {
            1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
            5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
            9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre"
        }
        
        df['MesNombre'] = df.apply(lambda r: f"{meses_es[r['Mes']]} {r['Anio']}", axis=1)
        
        # Create a sorting helper for months to ensure they go in chronological order in the pivot
        df['SortKey'] = df['Anio'] * 100 + df['Mes']
        month_order = df[['MesNombre', 'SortKey']].drop_duplicates().sort_values('SortKey')['MesNombre'].tolist()

        # 4. Pivot data
        # We want: Item | Desc | Jan 2024 (Uds) | Jan 2024 (Alb) | Feb 2024 (Uds) ...
        pivot_uds = df.pivot(index=['CodigoArticulo', 'Descripcion'], columns='MesNombre', values='Unidades').fillna(0)
        pivot_alb = df.pivot(index=['CodigoArticulo', 'Descripcion'], columns='MesNombre', values='Albaranes').fillna(0)
        
        # Rename columns to distinguish Uds vs Alb
        pivot_uds.columns = [f"{col} (Uds)" for col in pivot_uds.columns]
        pivot_alb.columns = [f"{col} (Alb)" for col in pivot_alb.columns]
        
        # Merge pivots
        final_df = pd.concat([pivot_uds, pivot_alb], axis=1)
        
        # Calculate overall rotation (Total Units) to allow sorting
        final_df['Total Rotación (Uds)'] = pivot_uds.sum(axis=1)
        
        # Reorder columns chronologically: [Jan (Uds), Jan (Alb), Feb (Uds), Feb (Alb)...]
        ordered_cols = ['Total Rotación (Uds)']
        for m in month_order:
            if f"{m} (Uds)" in final_df.columns:
                ordered_cols.append(f"{m} (Uds)")
            if f"{m} (Alb)" in final_df.columns:
                ordered_cols.append(f"{m} (Alb)")
        
        final_df = final_df[ordered_cols].reset_index()
        
        # Sort by total rotation descending
        final_df = final_df.sort_values(by='Total Rotación (Uds)', ascending=False)

        # 5. Generate Excel
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            final_df.to_excel(writer, index=False, sheet_name='Rotación 18 Meses')
            
            # Auto-adjust columns width
            worksheet = writer.sheets['Rotación 18 Meses']
            for i, col in enumerate(final_df.columns):
                # find maximum length of text in column
                max_len = max(
                    final_df[col].astype(str).map(len).max(),
                    len(str(col))
                ) + 2
                worksheet.column_dimensions[chr(65 + (i if i < 26 else i % 26))].width = min(max_len, 50) # Basic letter logic, but works for start

        output.seek(0)
        
        filename = f"Rotacion_Articulos_{datetime.now().strftime('%Y%m%d')}.xlsx"
        
        headers = {
            'Content-Disposition': f'attachment; filename="{filename}"'
        }
        
        return StreamingResponse(
            output,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers=headers
        )

    except Exception as e:
        print(f"Error generating rotation report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/abc-analysis")
def get_abc_analysis(
    page: int = 1,
    page_size: int = 50,
    search: Optional[str] = None,
    division: Optional[str] = None,
    tipo2025: Optional[str] = None,
    tipo2026: Optional[str] = None,
    proveedor: Optional[str] = None,
    subfamilia: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: str = "desc",
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_active_user)
):
    def check_is_authorized(u):
        r_name = str(u.role).lower()
        ro_name = str(u.role_obj.name).lower() if u.role_obj else ""
        return "admin" in r_name or "direcci" in r_name or "direccion" in r_name or "admin" in ro_name

    if not check_is_authorized(current_user):
        raise HTTPException(status_code=403, detail="Not authorized for this report")

    try:
        now = datetime.now()
        if (ABC_CACHE["df"] is not None and 
            ABC_CACHE["timestamp"] is not None and 
            (now - ABC_CACHE["timestamp"]).total_seconds() < CACHE_SECONDS):
            df_full = ABC_CACHE["df"]
        else:
            query_sales = """
                WITH SalesData AS (
                    SELECT 
                        RTRIM(LTRIM(CodigoArticulo)) as CodigoArticulo,
                        SUM(CASE WHEN FechaAlbaran >= '2025-01-01' AND FechaAlbaran < '2026-01-01' THEN Unidades ELSE 0 END) as Venta2025,
                        SUM(CASE WHEN FechaAlbaran >= '2026-01-01' AND FechaAlbaran < '2027-01-01' THEN Unidades ELSE 0 END) as Venta2026
                    FROM LineasAlbaranCliente WITH (NOLOCK)
                    WHERE FechaAlbaran >= '2025-01-01' AND FechaAlbaran < '2027-01-01'
                      AND CodigoEmpresa = 2
                      AND RTRIM(LTRIM(CodigoArticulo)) NOT IN ('', '.')
                    GROUP BY RTRIM(LTRIM(CodigoArticulo))
                )
                SELECT 
                    s.CodigoArticulo, a.DescripcionArticulo as Descripcion, a.CodigoFamilia as Familia, 
                    a.CodigoSubfamilia as Subfamilia, p.RazonSocial as Proveedor, s.Venta2025, s.Venta2026
                FROM SalesData s
                LEFT JOIN Articulos a WITH (NOLOCK) ON s.CodigoArticulo = a.CodigoArticulo AND a.CodigoEmpresa = 2
                LEFT JOIN Proveedores p WITH (NOLOCK) ON a.CodigoProveedor = p.CodigoProveedor AND a.CodigoEmpresa = 2
            """
            df_sales = pd.read_sql(text(query_sales), db.bind)
            query_stock = """
                SELECT RTRIM(LTRIM(CodigoArticulo)) as CodigoArticulo, MAX(UnidadSaldo) as StockActual 
                FROM PowerBi_AcumuladoStock WITH (NOLOCK)
                WHERE CodigoEmpresa = 2
                  AND Ejercicio = (SELECT MAX(Ejercicio) FROM PowerBi_AcumuladoStock WHERE CodigoEmpresa = 2)
                  AND Periodo = (SELECT MAX(Periodo) FROM PowerBi_AcumuladoStock WHERE CodigoEmpresa = 2 AND Ejercicio = (SELECT MAX(Ejercicio) FROM PowerBi_AcumuladoStock WHERE CodigoEmpresa = 2))
                GROUP BY CodigoArticulo
            """
            df_stock = pd.read_sql(text(query_stock), db.bind)
            df = pd.merge(df_sales, df_stock, on='CodigoArticulo', how='left').fillna(0)
            df['Division'] = df['Familia'].apply(map_division).fillna('Otros')

            def apply_abc(target_df, val_col, pct_col, type_col):
                w_df = target_df.sort_values(by=val_col, ascending=False).copy()
                total_val = w_df[val_col].sum()
                if total_val > 0:
                    w_df[pct_col] = (w_df[val_col] / total_val) * 100
                    c_pct = w_df[pct_col].cumsum()
                    w_df[type_col] = c_pct.apply(lambda cp: 'A' if cp <= 80.001 else ('B' if cp <= 96.001 else 'C'))
                else:
                    w_df[pct_col] = 0.0
                    w_df[type_col] = 'C'
                return w_df

            df_2025 = apply_abc(df, 'Venta2025', 'Porcentaje2025', 'Tipo2025')
            df_2026 = apply_abc(df, 'Venta2026', 'Porcentaje2026', 'Tipo2026')
            df_full = pd.merge(
                df_2025[['CodigoArticulo', 'Descripcion', 'Familia', 'Subfamilia', 'Division', 'Proveedor', 'Venta2025', 'Porcentaje2025', 'Tipo2025', 'StockActual']],
                df_2026[['CodigoArticulo', 'Venta2026', 'Porcentaje2026', 'Tipo2026']],
                on='CodigoArticulo'
            )
            cols_order = ['CodigoArticulo', 'Descripcion', 'Familia', 'Subfamilia', 'Proveedor', 'Division', 'Venta2025', 'Porcentaje2025', 'Tipo2025', 'Venta2026', 'Porcentaje2026', 'Tipo2026', 'StockActual']
            df_full = df_full[cols_order]
            ABC_CACHE["df"] = df_full
            ABC_CACHE["timestamp"] = now

        res = df_full.copy()
        if search:
            search = search.lower()
            res = res[res['CodigoArticulo'].str.lower().str.contains(search) | res['Descripcion'].str.lower().str.contains(search)]
        if division: res = res[res['Division'] == division]
        if tipo2025: res = res[res['Tipo2025'] == tipo2025]
        if tipo2026: res = res[res['Tipo2026'] == tipo2026]
        if proveedor: res = res[res['Proveedor'] == proveedor]
        if subfamilia: res = res[res['Subfamilia'] == subfamilia]
        if sort_by and sort_by in res.columns:
            res = res.sort_values(by=sort_by, ascending=(sort_order == "asc"))

        total = len(res)
        start = (page - 1) * page_size
        end = start + page_size
        paginated_data = res.iloc[start:end].to_dict('records')
        return {"data": paginated_data, "total": total, "page": page, "page_size": page_size, "total_pages": math.ceil(total / page_size)}
    except Exception as e:
        print(f"Error checking ABC Analysis logic: {e}")
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/abc-analysis/download")
def download_abc_analysis(
    search: Optional[str] = None,
    division: Optional[str] = None,
    tipo2025: Optional[str] = None,
    tipo2026: Optional[str] = None,
    proveedor: Optional[str] = None,
    subfamilia: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: str = "desc",
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_active_user)
):
    try:
        # Use a large page_size to get the "filtered" list without pagination slicing
        result = get_abc_analysis(
            page=1, 
            page_size=1000000, 
            search=search,
            division=division,
            tipo2025=tipo2025,
            tipo2026=tipo2026,
            proveedor=proveedor,
            subfamilia=subfamilia,
            sort_by=sort_by,
            sort_order=sort_order,
            db=db, 
            current_user=current_user
        )
        df = pd.DataFrame(result['data'])
        
        # Prepare for Excel: Divide percentages by 100 for Excel formatting
        for col in ['Porcentaje2025', 'Porcentaje2026']:
            if col in df.columns:
                df[col] = df[col] / 100

        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Análisis ABC')
            worksheet = writer.sheets['Análisis ABC']
            
            # Identify percentage columns
            pct_cols = [i + 1 for i, c in enumerate(df.columns) if 'Porcentaje' in c] # 1-indexed for openpyxl
            
            # Application of numeric and percentage formatting
            if not df.empty:
                for row in range(2, len(df) + 2): # Skip header
                    for col in pct_cols:
                        worksheet.cell(row=row, column=col).number_format = '0.00%'

            # Auto-adjust columns width
            for i, col in enumerate(df.columns):
                max_len = max(df[col].astype(str).map(len).max() if not df[col].empty else 10, len(str(col))) + 2
                # Correct column letter logic
                div = i // 26
                rem = i % 26
                col_letter = (chr(64 + div) if div > 0 else "") + chr(65 + rem)
                worksheet.column_dimensions[col_letter].width = min(max_len, 60)

        output.seek(0)
        filename = f"Analisis_ABC_{datetime.now().strftime('%Y%m%d')}.xlsx"
        headers = {'Content-Disposition': f'attachment; filename="{filename}"'}
        return StreamingResponse(output, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', headers=headers)
    except Exception as e:
        print(f"Error downloading ABC: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/abc-analysis/send-email")
def email_abc_analysis(
    search: Optional[str] = None,
    division: Optional[str] = None,
    tipo2025: Optional[str] = None,
    tipo2026: Optional[str] = None,
    proveedor: Optional[str] = None,
    subfamilia: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: str = "desc",
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_active_user)
):
    try:
        # Check if user has an email
        if not current_user.email:
            raise HTTPException(status_code=400, detail="Tu usuario no tiene una dirección de correo configurada.")

        # Same logic as download: big page_size
        result = get_abc_analysis(
            page=1, 
            page_size=1000000, 
            search=search,
            division=division,
            tipo2025=tipo2025,
            tipo2026=tipo2026,
            proveedor=proveedor,
            subfamilia=subfamilia,
            sort_by=sort_by,
            sort_order=sort_order,
            db=db, 
            current_user=current_user
        )
        df = pd.DataFrame(result['data'])
        
        # Prepare for Excel: Divide percentages by 100 for Excel formatting
        for col in ['Porcentaje2025', 'Porcentaje2026']:
            if col in df.columns:
                df[col] = df[col] / 100

        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Análisis ABC')
            worksheet = writer.sheets['Análisis ABC']
            
            # Identify percentage columns
            pct_cols = [i + 1 for i, c in enumerate(df.columns) if 'Porcentaje' in c] # 1-indexed for openpyxl
            
            # Application of numeric and percentage formatting
            if not df.empty:
                for row in range(2, len(df) + 2): # Skip header
                    for col in pct_cols:
                        worksheet.cell(row=row, column=col).number_format = '0.00%'

            # Auto-adjust columns width
            for i, col in enumerate(df.columns):
                max_len = max(df[col].astype(str).map(len).max() if not df[col].empty else 10, len(str(col))) + 2
                div = i // 26
                rem = i % 26
                col_letter = (chr(64 + div) if div > 0 else "") + chr(65 + rem)
                worksheet.column_dimensions[col_letter].width = min(max_len, 60)

        output.seek(0)
        filename = f"Analisis_ABC_{datetime.now().strftime('%Y%m%d')}.xlsx"
        
        # Add the file to the email and send it
        send_excel_report_email(
            to_email=current_user.email,
            excel_bytes=output,
            filename=filename,
            report_name="Informe de rotación"
        )
        
        return {"success": True, "message": f"Reporte enviado correctamente a {current_user.email}"}
        
    except Exception as e:
        print(f"Error sending ABC Analysis email: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/abc-providers")
def get_abc_providers(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    try:
        # Get unique providers that have sales in 2025/2026
        # This is more efficient than gathering the whole analysis for just providers
        query = """
            SELECT DISTINCT RTRIM(LTRIM(p.RazonSocial)) as Proveedor
            FROM LineasAlbaranCliente l WITH (NOLOCK)
            JOIN Articulos a WITH (NOLOCK) ON l.CodigoArticulo = a.CodigoArticulo AND l.CodigoEmpresa = a.CodigoEmpresa
            JOIN Proveedores p WITH (NOLOCK) ON a.CodigoProveedor = p.CodigoProveedor AND a.CodigoEmpresa = p.CodigoEmpresa
            WHERE YEAR(l.FechaAlbaran) IN (2025, 2026)
              AND l.CodigoEmpresa = 2
              AND p.RazonSocial IS NOT NULL AND p.RazonSocial != ''
            ORDER BY Proveedor
        """
        df = pd.read_sql(text(query), db.bind)
        return df['Proveedor'].tolist()
    except Exception as e:
        print(f"Error fetching ABC providers: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/abc-subfamilies")
def get_abc_subfamilies(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    try:
        # Get unique subfamilies that have sales in 2025/2026
        query = """
            SELECT DISTINCT RTRIM(LTRIM(a.CodigoSubfamilia)) as Subfamilia
            FROM LineasAlbaranCliente l WITH (NOLOCK)
            JOIN Articulos a WITH (NOLOCK) ON l.CodigoArticulo = a.CodigoArticulo AND l.CodigoEmpresa = a.CodigoEmpresa
            WHERE l.FechaAlbaran >= '2025-01-01' AND l.FechaAlbaran < '2027-01-01'
              AND l.CodigoEmpresa = 2
              AND a.CodigoSubfamilia IS NOT NULL AND a.CodigoSubfamilia != ''
            ORDER BY Subfamilia
        """
        df = pd.read_sql(text(query), db.bind)
        return df['Subfamilia'].tolist()
    except Exception as e:
        print(f"Error fetching ABC subfamilies: {e}")
        raise HTTPException(status_code=500, detail=str(e))
