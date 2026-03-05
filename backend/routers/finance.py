from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
import auth, models
import pandas as pd
from datetime import date
from typing import Optional
from pydantic import BaseModel
import pgc_mapping
import budget_parser

router = APIRouter(
    prefix="/api/finance",
    tags=["finance"]
)

class FinanceFilters(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    company_id: Optional[str] = None
    status: Optional[int] = None
    invoice_start_date: Optional[date] = None
    invoice_end_date: Optional[date] = None
    client_search: Optional[str] = None

class PnLFilters(BaseModel):
    year: int
    company_id: str
    month_up_to: Optional[int] = 12
    month_from: Optional[int] = 1

@router.post("/payments")
def get_payments_summary(filters: FinanceFilters, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    try:
        # We query CarteraEfectos directly to get StatusContabilizado and FechaFactura which are not in the view
        query = """
            SELECT 
                p.CodigoEmpresa,
                CASE p.Prevision WHEN 'C' THEN 'Cobros' ELSE 'Pagos' END AS Prevision,
                p.FechaVencimiento,
                p.FechaFactura,
                CASE p.Prevision WHEN 'C' THEN p.ImporteEfecto ELSE 0 END AS Cobro,
                CASE p.Prevision WHEN 'C' THEN 0 ELSE p.ImporteEfecto END AS Pago,
                cl.RazonSocial,
                pr.RazonSocial AS NombreProveedor,
                p.DocumentoConta,
                p.Comentario,
                p.CodigoClienteProveedor,
                p.CodigoCuenta as CuentaID,
                c.Cuenta as ConceptoCuenta,
                p.StatusBorrado as Status
            FROM CarteraEfectos p WITH (NOLOCK)
            LEFT JOIN Clientes cl WITH (NOLOCK) ON p.CodigoEmpresa = cl.CodigoEmpresa AND p.CodigoClienteProveedor = cl.CodigoCliente AND p.Prevision = 'C'
            LEFT JOIN Proveedores pr WITH (NOLOCK) ON p.CodigoEmpresa = pr.CodigoEmpresa AND p.CodigoClienteProveedor = pr.CodigoProveedor AND p.Prevision = 'P'
            LEFT JOIN PlanCuentasPGC c ON p.CodigoEmpresa = c.CodigoEmpresa AND p.CodigoCuenta = c.CodigoCuenta
            WHERE 1=1
        """
        params = {}
        
        if filters.company_id:
            query += " AND p.CodigoEmpresa = :company_id"
            params['company_id'] = filters.company_id
        else:
            query += " AND p.CodigoEmpresa IN (100, 2, 4, 6)"

        # Date Filters
        if filters.start_date:
            query += " AND p.FechaVencimiento >= :start_date"
            params['start_date'] = filters.start_date
        
        if filters.end_date:
            query += " AND p.FechaVencimiento <= :end_date"
            params['end_date'] = filters.end_date

        if filters.invoice_start_date:
            query += " AND p.FechaFactura >= :inv_start"
            params['inv_start'] = filters.invoice_start_date
        
        if filters.invoice_end_date:
            query += " AND p.FechaFactura <= :inv_end"
            params['inv_end'] = filters.invoice_end_date

        # Status Filter (Realizado -1 / Pendiente 0) based on StatusBorrado
        if filters.status is not None:
            query += " AND p.StatusBorrado = :status"
            params['status'] = filters.status

        if filters.client_search:
            query += " AND (CAST(p.CodigoClienteProveedor AS VARCHAR) LIKE :client_search OR ISNULL(cl.RazonSocial, pr.RazonSocial) LIKE :client_search)"
            params['client_search'] = f"%{filters.client_search}%"

        df = pd.read_sql(text(query), db.bind, params=params)
        
        if df.empty:
            return {
                "kpis": {"total_cobros": 0, "total_pagos": 0, "net_balance": 0},
                "items": []
            }
            
        total_cobros = float(df['Cobro'].sum())
        total_pagos = float(df['Pago'].sum())
        
        # Get min date from the resulting dataframe
        oldest_date = df['FechaVencimiento'].min().strftime('%Y-%m-%d') if not df.empty else None

        # Format dates for JSON
        df['FechaVencimiento'] = df['FechaVencimiento'].dt.strftime('%Y-%m-%d')
        if 'FechaFactura' in df.columns:
            df['FechaFactura'] = pd.to_datetime(df['FechaFactura']).dt.strftime('%Y-%m-%d')
        df = df.fillna('')
        
        items = df.sort_values('FechaVencimiento', ascending=True).head(500).to_dict(orient='records')
        
        return {
            "kpis": {
                "total_count": len(df),
                "total_cobros": total_cobros,
                "total_pagos": total_pagos,
                "net_balance": total_cobros - total_pagos,
                "oldest_date": oldest_date
            },
            "items": items
        }
    except Exception as e:
        print(f"Error in payments: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/pnl")
def get_pnl_statement(filters: PnLFilters, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    try:
        # Professional P&L structure based on PGC
        query = """
        SELECT 
            CASE 
                -- RESULTADO DE EXPLOTACIÓN
                WHEN CodigoCuenta LIKE '700%' OR CodigoCuenta LIKE '701%' OR CodigoCuenta LIKE '702%' OR CodigoCuenta LIKE '703%' OR CodigoCuenta LIKE '704%' OR CodigoCuenta LIKE '705%' THEN '1. Cifra de negocios'
                WHEN CodigoCuenta LIKE '71%' THEN '2. Variación de existencias'
                WHEN CodigoCuenta LIKE '73%' THEN '3. Trabajos para el activo'
                WHEN CodigoCuenta LIKE '600%' OR CodigoCuenta LIKE '601%' OR CodigoCuenta LIKE '602%' OR CodigoCuenta LIKE '607%' OR CodigoCuenta LIKE '61%' THEN '4. Aprovisionamientos'
                WHEN CodigoCuenta LIKE '74%' OR CodigoCuenta LIKE '75%' THEN '5. Otros ingresos de explotación'
                WHEN CodigoCuenta LIKE '64%' THEN '6. Gastos de personal'
                WHEN CodigoCuenta LIKE '62%' OR CodigoCuenta LIKE '631%' OR CodigoCuenta LIKE '634%' OR CodigoCuenta LIKE '636%' OR CodigoCuenta LIKE '639%' OR CodigoCuenta LIKE '65%' THEN '7. Otros gastos de explotación'
                WHEN CodigoCuenta LIKE '68%' THEN '8. Amortización del inmovilizado'
                WHEN CodigoCuenta LIKE '795%' OR CodigoCuenta LIKE '695%' THEN '9. Imputación de subvenciones'
                WHEN CodigoCuenta LIKE '690%' OR CodigoCuenta LIKE '691%' OR CodigoCuenta LIKE '692%' OR CodigoCuenta LIKE '790%' OR CodigoCuenta LIKE '791%' OR CodigoCuenta LIKE '792%' THEN '10. Excesos de provisiones'
                WHEN CodigoCuenta LIKE '67%' OR CodigoCuenta LIKE '77%' THEN '11. Deterioro y resultados enajenaciones'
                
                -- RESULTADO FINANCIERO
                WHEN CodigoCuenta LIKE '760%' OR CodigoCuenta LIKE '761%' OR CodigoCuenta LIKE '762%' OR CodigoCuenta LIKE '767%' OR CodigoCuenta LIKE '769%' THEN '12. Ingresos financieros'
                WHEN CodigoCuenta LIKE '660%' OR CodigoCuenta LIKE '661%' OR CodigoCuenta LIKE '662%' OR CodigoCuenta LIKE '664%' OR CodigoCuenta LIKE '665%' OR CodigoCuenta LIKE '666%' OR CodigoCuenta LIKE '667%' OR CodigoCuenta LIKE '668%' THEN '13. Gastos financieros'
                WHEN CodigoCuenta LIKE '663%' OR CodigoCuenta LIKE '763%' THEN '14. Variación de valor instrumentos fin.'
                WHEN CodigoCuenta LIKE '668%' OR CodigoCuenta LIKE '768%' THEN '15. Diferencias de cambio'
                WHEN CodigoCuenta LIKE '696%' OR CodigoCuenta LIKE '697%' OR CodigoCuenta LIKE '698%' OR CodigoCuenta LIKE '699%' OR CodigoCuenta LIKE '796%' OR CodigoCuenta LIKE '797%' OR CodigoCuenta LIKE '798%' OR CodigoCuenta LIKE '799%' THEN '16. Deterioro instrumentos financieros'
                
                -- IMPUESTOS
                WHEN CodigoCuenta LIKE '630%' THEN '17. Impuesto sobre beneficios'
                
                ELSE 'Otros Ingresos/Gastos'
            END AS Apartado_PyG,
            CASE 
                WHEN CodigoCuenta LIKE '6%' THEN 'Gasto'
                WHEN CodigoCuenta LIKE '7%' THEN 'Ingreso'
            END AS Tipo_Cuenta,
            SUM(HaberAcum - DebeAcum) AS Total
        FROM AcumuladosConta
        WHERE CodigoEmpresa = :company_id
          AND Ejercicio = :year
          AND NumeroPeriodo BETWEEN 1 AND :month_up_to
          AND (CodigoCuenta LIKE '6%' OR CodigoCuenta LIKE '7%')
        GROUP BY 
            CASE 
                WHEN CodigoCuenta LIKE '700%' OR CodigoCuenta LIKE '701%' OR CodigoCuenta LIKE '702%' OR CodigoCuenta LIKE '703%' OR CodigoCuenta LIKE '704%' OR CodigoCuenta LIKE '705%' THEN '1. Cifra de negocios'
                WHEN CodigoCuenta LIKE '71%' THEN '2. Variación de existencias'
                WHEN CodigoCuenta LIKE '73%' THEN '3. Trabajos para el activo'
                WHEN CodigoCuenta LIKE '600%' OR CodigoCuenta LIKE '601%' OR CodigoCuenta LIKE '602%' OR CodigoCuenta LIKE '607%' OR CodigoCuenta LIKE '61%' THEN '4. Aprovisionamientos'
                WHEN CodigoCuenta LIKE '74%' OR CodigoCuenta LIKE '75%' THEN '5. Otros ingresos de explotación'
                WHEN CodigoCuenta LIKE '64%' THEN '6. Gastos de personal'
                WHEN CodigoCuenta LIKE '62%' OR CodigoCuenta LIKE '631%' OR CodigoCuenta LIKE '634%' OR CodigoCuenta LIKE '636%' OR CodigoCuenta LIKE '639%' OR CodigoCuenta LIKE '65%' THEN '7. Otros gastos de explotación'
                WHEN CodigoCuenta LIKE '68%' THEN '8. Amortización del inmovilizado'
                WHEN CodigoCuenta LIKE '795%' OR CodigoCuenta LIKE '695%' THEN '9. Imputación de subvenciones'
                WHEN CodigoCuenta LIKE '690%' OR CodigoCuenta LIKE '691%' OR CodigoCuenta LIKE '692%' OR CodigoCuenta LIKE '790%' OR CodigoCuenta LIKE '791%' OR CodigoCuenta LIKE '792%' THEN '10. Excesos de provisiones'
                WHEN CodigoCuenta LIKE '67%' OR CodigoCuenta LIKE '77%' THEN '11. Deterioro y resultados enajenaciones'
                WHEN CodigoCuenta LIKE '760%' OR CodigoCuenta LIKE '761%' OR CodigoCuenta LIKE '762%' OR CodigoCuenta LIKE '767%' OR CodigoCuenta LIKE '769%' THEN '12. Ingresos financieros'
                WHEN CodigoCuenta LIKE '660%' OR CodigoCuenta LIKE '661%' OR CodigoCuenta LIKE '662%' OR CodigoCuenta LIKE '664%' OR CodigoCuenta LIKE '665%' OR CodigoCuenta LIKE '666%' OR CodigoCuenta LIKE '667%' OR CodigoCuenta LIKE '668%' THEN '13. Gastos financieros'
                WHEN CodigoCuenta LIKE '663%' OR CodigoCuenta LIKE '763%' THEN '14. Variación de valor instrumentos fin.'
                WHEN CodigoCuenta LIKE '668%' OR CodigoCuenta LIKE '768%' THEN '15. Diferencias de cambio'
                WHEN CodigoCuenta LIKE '696%' OR CodigoCuenta LIKE '697%' OR CodigoCuenta LIKE '698%' OR CodigoCuenta LIKE '699%' OR CodigoCuenta LIKE '796%' OR CodigoCuenta LIKE '797%' OR CodigoCuenta LIKE '798%' OR CodigoCuenta LIKE '799%' THEN '16. Deterioro instrumentos financieros'
                WHEN CodigoCuenta LIKE '630%' THEN '17. Impuesto sobre beneficios'
                ELSE 'Otros Ingresos/Gastos'
            END,
            CASE 
                WHEN CodigoCuenta LIKE '6%' THEN 'Gasto'
                WHEN CodigoCuenta LIKE '7%' THEN 'Ingreso'
            END
        HAVING SUM(HaberAcum - DebeAcum) != 0
        """
        params = {
            "company_id": filters.company_id,
            "year": filters.year,
            "month_up_to": filters.month_up_to
        }
        df = pd.read_sql(text(query), db.bind, params=params)
        
        if df.empty:
            return []
            
        # Group into the sub-totals
        def get_group(apartado):
            if any(x in apartado for x in ['1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '10.', '11.']):
                return 'EXPLOTACION'
            if any(x in apartado for x in ['12.', '13.', '14.', '15.', '16.']):
                return 'FINANCIERO'
            if '17.' in apartado:
                return 'IMPUESTOS'
            return 'EXPLOTACION'

        df['Grupo'] = df['Apartado_PyG'].apply(get_group)
        
        # Calculate sub-totals
        res_explotacion = df[df['Grupo'] == 'EXPLOTACION']['Total'].sum()
        res_financiero = df[df['Grupo'] == 'FINANCIERO']['Total'].sum()
        res_antes_imp = res_explotacion + res_financiero
        impuestos = df[df['Grupo'] == 'IMPUESTOS']['Total'].sum()
        res_ejercicio = res_antes_imp + impuestos # Taxes are group 630 so Haber-Debe will be negative if it's an expense

        # Prepare final list with subtotals mixed in or metadata?
        # Let's send a structured object
        return {
            "details": df.to_dict(orient='records'),
            "summary": {
                "resultado_explotacion": res_explotacion,
                "resultado_financiero": res_financiero,
                "resultado_antes_impuestos": res_antes_imp,
                "impuestos": impuestos,
                "resultado_ejercicio": res_ejercicio
            }
        }
    except Exception as e:
        print(f"Error in pnl: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/pnl-evolution")
def get_pnl_evolution(filters: PnLFilters, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    try:
        # Get monthly totals for Revenue (Group 7) and Expenses (Group 6)
        query = """
        SELECT 
            NumeroPeriodo as Month,
            SUM(CASE WHEN CodigoCuenta LIKE '7%' THEN HaberAcum - DebeAcum ELSE 0 END) as Ingresos,
            SUM(CASE WHEN CodigoCuenta LIKE '6%' THEN DebeAcum - HaberAcum ELSE 0 END) as Gastos
        FROM AcumuladosConta
        WHERE CodigoEmpresa = :company_id
          AND Ejercicio = :year
          AND NumeroPeriodo BETWEEN 1 AND 12
          AND (CodigoCuenta LIKE '6%' OR CodigoCuenta LIKE '7%')
        GROUP BY NumeroPeriodo
        ORDER BY NumeroPeriodo
        """
        params = {
            "company_id": filters.company_id,
            "year": filters.year
        }
        df = pd.read_sql(text(query), db.bind, params=params)
        
        if df.empty:
            return []
            
        # Ensure all 12 months are present
        all_months = pd.DataFrame({'Month': range(1, 13)})
        df = pd.merge(all_months, df, on='Month', how='left').fillna(0)
        
        return df.to_dict(orient='records')
    except Exception as e:
        print(f"Error in pnl evolution: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pnl-detailed")
def get_pnl_detailed(filters: PnLFilters, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    try:
        # month_from defaults to 1 if not provided
        m_from = filters.month_from or 1
        m_to = filters.month_up_to or 12
        
        # 1. Fetch real cumulative balances for [month_to] and [month_from - 1]
        # prev_month is the month just BEFORE the start of our range
        prev_month = m_from - 1
        
        query = """
        SELECT 
            CodigoCuenta,
            NumeroPeriodo,
            DebeAcum,
            HaberAcum
        FROM AcumuladosConta
        WHERE CodigoEmpresa = :company_id
          AND Ejercicio = :year
          AND NumeroPeriodo IN (:month, :prev_month)
          AND (CodigoCuenta LIKE '6%' OR CodigoCuenta LIKE '7%')
        """
        params = {
            "company_id": filters.company_id,
            "year": filters.year,
            "month": m_to,
            "prev_month": prev_month
        }
        df_real = pd.read_sql(text(query), db.bind, params=params)
        
        # 2. Fetch account names
        query_names = """
        SELECT CodigoCuenta, Cuenta as Nombre
        FROM PlanCuentasPGC
        WHERE CodigoEmpresa = :company_id
          AND (CodigoCuenta LIKE '6%' OR CodigoCuenta LIKE '7%')
        """
        df_names = pd.read_sql(text(query_names), db.bind, params={"company_id": filters.company_id})
        names_map = dict(zip(df_names['CodigoCuenta'], df_names['Nombre']))
        
        # 3. Get Budget Data for specific company (Read ONCE)
        budget_data = budget_parser.get_budget_data(company_id=filters.company_id)
        
        # 4. Process all accounts (Union of Real and Budget)
        # Ensure codes are clean strings for both
        db_accounts_raw = df_real['CodigoCuenta'].unique()
        db_accounts = [str(c).strip() for c in db_accounts_raw]
        excel_accounts = [str(c).strip() for c in budget_data.keys()]
        all_accounts = set(db_accounts) | set(excel_accounts)
        
        processed_accounts = []
        
        for acc in all_accounts:
            # Real Data
            row_current = df_real[(df_real['CodigoCuenta'].astype(str).str.strip() == acc) & (df_real['NumeroPeriodo'] == m_to)]
            row_prev = df_real[(df_real['CodigoCuenta'].astype(str).str.strip() == acc) & (df_real['NumeroPeriodo'] == prev_month)]
            
            # Cumulative
            haber_acum = row_current['HaberAcum'].sum() if not row_current.empty else 0.0
            debe_acum = row_current['DebeAcum'].sum() if not row_current.empty else 0.0
            real_acum = haber_acum - debe_acum
            
            # Period
            haber_prev = row_prev['HaberAcum'].sum() if not row_prev.empty else 0.0
            debe_prev = row_prev['DebeAcum'].sum() if not row_prev.empty else 0.0
            real_period = real_acum - (haber_prev - debe_prev)
            
            # Budget Data - Look up in budget_data dict (efficiently)
            # Try exact match first
            months = budget_data.get(acc)
            if not months:
                # Try prefix match (e.g. Sage 7000000001 vs Excel 700000001)
                for b_code, b_months in budget_data.items():
                    if acc.startswith(b_code) or b_code.startswith(acc):
                        months = b_months
                        break
            
            presu_period = 0.0
            presu_acum = 0.0
            if months:
                # Sum range for period
                presu_period = sum(months[max(0, m_from-1) : min(12, m_to)])
                # Sum up to m_to for accumulated
                presu_acum = sum(months[:min(12, m_to)])
            
            # Sign correction: Income (7) positive, Expense (6) negative
            sign = -1.0 if acc.startswith('6') else 1.0
            signed_presu_period = presu_period * sign
            signed_presu_acum = presu_acum * sign
            
            if abs(real_acum) < 0.01 and abs(real_period) < 0.01 and abs(signed_presu_period) < 0.01 and abs(signed_presu_acum) < 0.01:
                continue
                
            processed_accounts.append({
                "code": acc,
                "name": names_map.get(acc, f"Cuenta {acc}"),
                "real_p": float(real_period),
                "presu_p": float(signed_presu_period),
                "real_a": float(real_acum),
                "presu_a": float(signed_presu_acum)
            })

        # 5. Build Hierarchy
        def build_tree(structure, accounts):
            results = []
            for node in structure:
                node_data = {
                    "id": node["id"],
                    "name": node["name"],
                    "children": [],
                    "accounts": [],
                    "real_p": 0.0,
                    "presu_p": 0.0,
                    "real_a": 0.0,
                    "presu_a": 0.0
                }
                
                # Direct accounts mapping to this node
                patterns = node.get("patterns", [])
                for p in patterns:
                    p_clean = p.replace("%", "").strip()
                    for acc in accounts:
                        if acc["code"].startswith(p_clean):
                            node_data["accounts"].append(acc)
                            node_data["real_p"] += acc["real_p"]
                            node_data["presu_p"] += acc["presu_p"]
                            node_data["real_a"] += acc["real_a"]
                            node_data["presu_a"] += acc["presu_a"]
                
                # Recursive children
                if "children" in node:
                    node_data["children"] = build_tree(node["children"], accounts)
                    for child in node_data["children"]:
                        node_data["real_p"] += child["real_p"]
                        node_data["presu_p"] += child["presu_p"]
                        node_data["real_a"] += child["real_a"]
                        node_data["presu_a"] += child["presu_a"]
                
                # Check if this node has ANY value or children
                if abs(node_data["real_a"]) > 0.001 or abs(node_data["presu_a"]) > 0.001 or node_data["children"]:
                    results.append(node_data)
                    
            return results

        tree = build_tree(pgc_mapping.PGC_PG_STRUCTURE, processed_accounts)
        
        # Summary totals
        res_real_p = sum(n["real_p"] for n in tree if n["id"] in ['A', 'B'])
        res_presu_p = sum(n["presu_p"] for n in tree if n["id"] in ['A', 'B'])
        res_real_a = sum(n["real_a"] for n in tree if n["id"] in ['A', 'B'])
        res_presu_a = sum(n["presu_a"] for n in tree if n["id"] in ['A', 'B'])

        return {
            "tree": tree,
            "summary": {
                "real_p": float(res_real_p),
                "presu_p": float(res_presu_p),
                "real_a": float(res_real_a),
                "presu_a": float(res_presu_a)
            }
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
