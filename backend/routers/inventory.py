from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
import pandas as pd
from typing import List, Optional
from pydantic import BaseModel
from database import get_db
import auth
import models

router = APIRouter()

class InventoryFilters(BaseModel):
    exercise: Optional[int] = None
    period: Optional[int] = None
    company_id: Optional[str] = None
    warehouse_id: Optional[str] = None

def map_division(fam):
    fam = str(fam).strip().upper()
    if fam == 'M': return 'Mecánica'
    elif fam == 'C': return 'Conectrónica'
    elif fam == 'I': return 'Informática Industrial'
    elif fam in ['CONTA', 'CONS']: return 'Estructura/Otros'
    else: return 'Otros'

@router.post("/dashboard")
def get_inventory_dashboard(filters: InventoryFilters, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    try:
        # 1. Get current stock levels (most recent period or user selected)
        # FORCE company 2 as requested
        company_id = 2

        # Use user filters or detect latest
        if filters.exercise is not None and filters.period is not None:
            latest_exercise = int(filters.exercise)
            latest_period = int(filters.period)
        else:
            # First find the latest exercise and period FOR THIS COMPANY
            latest_info_query = f"""
                SELECT TOP 1 Ejercicio, Periodo 
                FROM PowerBi_AcumuladoStock WITH (NOLOCK)
                WHERE CodigoEmpresa = {company_id}
                ORDER BY Ejercicio DESC, Periodo DESC
            """
            latest_info = pd.read_sql(text(latest_info_query), db.bind)
            if latest_info.empty:
                return {
                    "kpis": {"total_value": 0, "total_units": 0, "period": "N/D"},
                    "evolution": [],
                    "top_divisions": [],
                    "inventory_table": []
                }
            
            latest_exercise = int(latest_info.iloc[0]['Ejercicio'])
            latest_period = int(latest_info.iloc[0]['Periodo'])

        # Query for latest status
        status_query = """
            SELECT 
                CodigoArticulo, DescripcionArticulo, Almacen, 
                UnidadSaldo, ImporteSaldo, CodigoFamilia, DescripcionFamilia
            FROM PowerBi_AcumuladoStock WITH (NOLOCK)
            WHERE Ejercicio = :ex AND Periodo = :per AND CodigoEmpresa = :company_id
        """
        params = {
            "ex": latest_exercise, 
            "per": latest_period,
            "company_id": company_id
        }
        
        if filters.warehouse_id:
            status_query += " AND Almacen LIKE :wh"
            params["wh"] = f"%{filters.warehouse_id}%"

        df_status = pd.read_sql(text(status_query), db.bind, params=params)
        
        if df_status.empty:
            return {
                "kpis": {
                    "total_value": 0, 
                    "total_units": 0,
                    "period": f"{latest_period}/{latest_exercise}"
                },
                "evolution": [],
                "top_divisions": [],
                "inventory_table": []
            }

        # KPIs
        total_value = float(df_status['ImporteSaldo'].sum())
        total_units = float(df_status['UnidadSaldo'].sum())

        # Divisions
        df_status['Division'] = df_status['CodigoFamilia'].apply(map_division)
        top_divisions = df_status.groupby('Division')['ImporteSaldo'].sum().sort_values(ascending=False).reset_index()
        top_divisions_data = top_divisions.rename(columns={'Division': 'name', 'ImporteSaldo': 'value'}).to_dict('records')

        # Detail Table
        details = df_status.groupby(['Division', 'DescripcionArticulo']).agg(
            Importe=('ImporteSaldo', 'sum'),
            Unidades=('UnidadSaldo', 'sum')
        ).reset_index()
        details = details.sort_values(by=['Division', 'Importe'], ascending=[True, False])
        inventory_table = details.groupby('Division').head(50).to_dict('records')

        # 2. History Evolution
        history_query = """
            SELECT 
                Ejercicio, Periodo, TextoPeriodo,
                SUM(ImporteSaldo) as ImporteTotal
            FROM PowerBi_AcumuladoStock WITH (NOLOCK)
            WHERE CodigoEmpresa = :company_id
        """
        hist_params = {"company_id": company_id}
        
        history_query += " GROUP BY Ejercicio, Periodo, TextoPeriodo ORDER BY Ejercicio, Periodo"
        
        df_history = pd.read_sql(text(history_query), db.bind, params=hist_params)
        evolution_data = []
        for _, row in df_history.iterrows():
            evolution_data.append({
                "name": f"{row['TextoPeriodo']} {row['Ejercicio']}",
                "value": float(row['ImporteTotal']),
                "ejercicio": int(row['Ejercicio']),
                "periodo": int(row['Periodo'])
            })

        return {
            "kpis": {
                "total_value": total_value,
                "total_units": total_units,
                "period": f"{latest_period}/{latest_exercise}"
            },
            "evolution": evolution_data,
            "top_divisions": top_divisions_data,
            "inventory_table": inventory_table
        }

    except Exception as e:
        print(f"Error in inventory dashboard: {e}")
        return {"error": str(e)}
