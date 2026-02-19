from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
import pandas as pd
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
def get_pending_orders(filters: PendingOrdersFilters, db: Session = Depends(get_db)):
    try:
        # Define Division Mapping (consistent with sales.py)
        # Note: 'Mecánica' in screenshot matches 'Sismecánica' reps
        divisions = {
            'Conectrónica': ['JOSE CESPEDES BLANCO', 'ANTONIO MACHO MACHO', 'JESUS COLLADO ARAQUE'],
            'Sismecánica': ['JUAN CARLOS BENITO RAMOS', 'JAVIER ALLEN PERKINS'], # Maps to 'Mecánica' in UI
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
                p.CodigoComisionista
            FROM CEN_PowerBi_LineasPedVen_Vendedor p
            LEFT JOIN Comisionistas c ON p.CodigoComisionista = c.CodigoComisionista AND p.CodigoEmpresa = c.CodigoEmpresa
            WHERE p.UnidadesPendientes > 0
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
        
        if df.empty:
             return {"kpis": {"total_orders": 0, "total_amount": 0}, "by_division": []}

        # Clean Comisionista names
        df['Comisionista'] = df['Comisionista'].str.strip().str.upper()

        # Map to Division
        def get_division(rep_name):
            if not rep_name: return 'Otros'
            for div, reps in divisions.items():
                if rep_name in reps:
                    return div
            return 'Otros'

        df['Division'] = df['Comisionista'].apply(get_division)
        
        # Filter out 'Otros' as requested
        df = df[df['Division'] != 'Otros']
        
        # Filter by Division if requested
        if filters.division:
            target_division = filters.division
            if target_division == 'Mecánica':
                target_division = 'Sismecánica'
            df = df[df['Division'] == target_division]
            
        # Filter by Rep if requested (using ID from query)
        if filters.sales_rep_id:
             df = df[df['CodigoComisionista'] == filters.sales_rep_id]

        if df.empty:
             return {"kpis": {"total_orders": 0, "total_amount": 0}, "by_division": []}

        # Calculate Metrics
        # Coste Linea = UnidadesPendientes * PrecioCoste
        df['CosteTotal'] = df['UnidadesPendientes'] * df['PrecioCoste']
        
        # Group by Division for the charts
        division_group = df.groupby('Division').agg(
            PendingAmount=('BaseImponiblePendiente', 'sum'),
            PendingCost=('CosteTotal', 'sum'),
            OrderCount=('NumeroPedido', 'nunique')
        ).reset_index()
        
        # Calculate Margin %: (Amount - Cost) / Amount
        division_group['MarginPct'] = (division_group['PendingAmount'] - division_group['PendingCost']) / division_group['PendingAmount']
        division_group['MarginPct'] = division_group['MarginPct'].fillna(0) # Handle division by zero
        
        # Rename Sismecánica to Mecánica for UI text (optional)
        division_group['Division'] = division_group['Division'].replace('Sismecánica', 'Mecánica')

        # KPIs for the top cards
        total_orders = int(df['NumeroPedido'].nunique())
        total_amount = float(df['BaseImponiblePendiente'].sum())
        
        # Format for Frontend (sorting by Amount desc)
        division_group = division_group.sort_values('PendingAmount', ascending=False)
        by_division_data = division_group.to_dict(orient='records')
        
        return {
            "kpis": {
                "total_orders": total_orders,
                "total_amount": total_amount
            },
            "by_division": by_division_data
        }

    except Exception as e:
        print(f"Error in pending orders: {e}")
        raise HTTPException(status_code=500, detail=str(e))
