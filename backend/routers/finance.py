from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
import auth, models
import pandas as pd
from datetime import date
from typing import Optional
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/finance",
    tags=["finance"]
)

class FinanceFilters(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    company_id: Optional[str] = None

class PnLFilters(BaseModel):
    year: int
    company_id: str
    month_up_to: Optional[int] = 12

@router.post("/payments")
def get_payments_summary(filters: FinanceFilters, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    try:
        # User defined companies: 100, 2, 4, 6
        # Join with PlanCuentasPGC to get account concept (Cuenta column)
        query = """
            SELECT 
                p.CodigoEmpresa,
                p.Prevision,
                p.FechaVencimiento,
                p.ImporteC as Cobro,
                p.ImporteB as Pago,
                p.RazonSocial,
                p.NombreProveedor,
                p.DocumentoConta,
                p.Comentario,
                p.Expr1 as CuentaID,
                c.Cuenta as ConceptoCuenta
            FROM PowerBi_CarteraCoPa p
            LEFT JOIN PlanCuentasPGC c ON p.CodigoEmpresa = c.CodigoEmpresa AND p.Expr1 = c.CodigoCuenta
            WHERE 1=1
        """
        params = {}
        
        if filters.company_id:
            query += " AND p.CodigoEmpresa = :company_id"
            params['company_id'] = filters.company_id
        else:
            query += " AND p.CodigoEmpresa IN (100, 2, 4, 6)"

        if filters.start_date:
            query += " AND p.FechaVencimiento >= :start_date"
            params['start_date'] = filters.start_date
        
        if filters.end_date:
            query += " AND p.FechaVencimiento <= :end_date"
            params['end_date'] = filters.end_date

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
        df = df.fillna('')
        
        items = df.sort_values('FechaVencimiento', ascending=True).to_dict(orient='records')
        
        return {
            "kpis": {
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


