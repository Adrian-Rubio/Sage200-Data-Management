from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
import pandas as pd
import auth, models
from typing import Optional
from pydantic import BaseModel
from datetime import date

router = APIRouter(
    prefix="/api/orders",
    tags=["orders"]
)

class PendingOrdersFilters(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    company_id: Optional[str] = None
    sales_rep_id: Optional[str] = None
    division: Optional[str] = None

@router.post("/pending")
def get_pending_orders(filters: PendingOrdersFilters, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    try:
        # Define Division Mapping (consistent with sales.py)
        # Note: 'Mecánica' in screenshot matches 'Sismecánica' reps
        divisions = {
            'Conectrónica': ['JOSE CESPEDES BLANCO', 'ANTONIO MACHO MACHO', 'JESUS COLLADO ARAQUE', 'ADRIÁN ROMERO JIMENEZ'],
            'Sismecánica': ['JUAN CARLOS BENITO RAMOS', 'JAVIER ALLEN PERKINS'],
            'Informática Industrial': ['JUAN CARLOS VALDES ANTON']
        }
        
        # Reverse mapping for filtering if division is selected
        target_reps = []
        if filters.sales_rep_id:
             # If specific rep selected, search for name by ID in DB or trust frontend
             # For now, simplistic approach: trust filters.sales_rep_id is the ID or Name
             # Given sales.py uses the Name for filtering, let's assume we filter by NAME here too if passed
             pass
        
        basic_query = """
            SELECT 
                c.Comisionista,
                p.BaseImponiblePendiente,
                p.UnidadesPendientes, 
                p.PrecioCoste,
                p.NumeroPedido,
                p.CodigoComisionista,
                p.RazonSocial as Cliente
            FROM CEN_PowerBi_LineasPedVen_Vendedor p
            LEFT JOIN Comisionistas c ON p.CodigoComisionistaLinea = c.CodigoComisionista AND p.CodigoEmpresa = c.CodigoEmpresa
            WHERE p.UnidadesPendientes > 0
            AND p.CodigoEmpresa = '2'
        """
        
        params = {}
        
        # Add basic filters
        if filters.start_date:
            basic_query += " AND p.FechaPedido >= :start_date"
            params['start_date'] = filters.start_date
        
        if filters.end_date:
            basic_query += " AND p.FechaPedido <= :end_date"
            params['end_date'] = filters.end_date

        if filters.company_id:
            basic_query += " AND p.CodigoEmpresa = :company_id"
            params['company_id'] = filters.company_id
        
        # Execute to DF first
        df = pd.read_sql(text(basic_query), db.bind, params=params)
        
        # Default JSON-safe response for empty state
        empty_res = {
            "kpis": {
                "total_orders": 0, 
                "total_amount": 0,
                "total_units": 0,
                "global_margin_pct": 0
            },
            "by_division": [],
            "detailed_orders": []
        }

        if df.empty:
             return empty_res

        # Clean strings
        df['Comisionista'] = df['Comisionista'].str.strip().str.upper().fillna('S/C')
        df['Cliente'] = df['Cliente'].str.strip().fillna('S/C')

        # Map to Division
        def get_division(rep_name):
            if not rep_name or pd.isna(rep_name): return 'Otros'
            for div, reps in divisions.items():
                if rep_name in reps:
                    return div
            return 'Otros'

        df['Division'] = df['Comisionista'].apply(get_division)
        
        # Filter out 'Otros' as requested
        # Note: If it's a restricted rep, we don't want to hide their data if they are classed as 'Otros' 
        # but the prompt says 'Filter out Otros as requested'. Let's keep existing logic.
        df_display = df[df['Division'] != 'Otros'].copy()
        
        # Filter by Division if requested
        if filters.division:
            target_division = filters.division
            if target_division == 'Mecánica':
                target_division = 'Sismecánica'
            df_display = df_display[df_display['Division'] == target_division]
            
        # Filter by Rep if requested
        if current_user.role == "comercial" and current_user.sales_rep_id:
             df_display = df_display[df_display['Comisionista'] == current_user.sales_rep_id.upper()]
        elif filters.sales_rep_id:
             df_display = df_display[df_display['Comisionista'] == filters.sales_rep_id.strip().upper()]

        if df_display.empty:
             return empty_res

        # Calculate Metrics
        df_display['CosteTotal'] = df_display['UnidadesPendientes'] * df_display['PrecioCoste']
        
        # --- Group by Division for the charts ---
        division_group = df_display.groupby('Division').agg(
            PendingAmount=('BaseImponiblePendiente', 'sum'),
            PendingCost=('CosteTotal', 'sum'),
            OrderCount=('NumeroPedido', 'nunique')
        ).reset_index()
        
        # Avoid inf/nan in margin calculation
        division_group['MarginPct'] = 0.0
        mask = division_group['PendingAmount'] != 0
        division_group.loc[mask, 'MarginPct'] = (division_group['PendingAmount'] - division_group['PendingCost']) / division_group['PendingAmount']
        
        division_group['Division'] = division_group['Division'].replace('Sismecánica', 'Mecánica')

        # --- Detailed Orders List ---
        orders_detailed = df_display.groupby(['NumeroPedido', 'Cliente', 'Comisionista', 'Division']).agg(
            Importe=('BaseImponiblePendiente', 'sum'),
            Coste=('CosteTotal', 'sum'),
            Unidades=('UnidadesPendientes', 'sum')
        ).reset_index()
        
        orders_detailed['MarginPct'] = 0.0
        mask_d = orders_detailed['Importe'] != 0
        orders_detailed.loc[mask_d, 'MarginPct'] = ((orders_detailed['Importe'] - orders_detailed['Coste']) / orders_detailed['Importe']) * 100
        
        orders_detailed['Division'] = orders_detailed['Division'].replace('Sismecánica', 'Mecánica')
        
        # Sort by Amount Desc
        detailed_orders_list = orders_detailed.sort_values('Importe', ascending=False).to_dict(orient='records')

        # KPIs for the top cards
        total_orders = int(df_display['NumeroPedido'].nunique())
        total_amount = float(df_display['BaseImponiblePendiente'].sum())
        total_cost = float(df_display['CosteTotal'].sum())
        total_units = float(df_display['UnidadesPendientes'].sum())
        
        global_margin_pct = 0.0
        if total_amount > 0:
            global_margin_pct = (total_amount - total_cost) / total_amount * 100

        return {
            "kpis": {
                "total_orders": total_orders,
                "total_amount": total_amount,
                "total_units": total_units,
                "global_margin_pct": global_margin_pct
            },
            "by_division": division_group.sort_values('PendingAmount', ascending=False).to_dict(orient='records'),
            "detailed_orders": detailed_orders_list
        }

    except Exception as e:
        print(f"Error in pending orders: {e}")
        raise HTTPException(status_code=500, detail=str(e))
