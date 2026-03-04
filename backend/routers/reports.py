from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
import auth, models
import pandas as pd
from typing import Optional
from pydantic import BaseModel

router = APIRouter()

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
