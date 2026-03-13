from fastapi import APIRouter, HTTPException, Depends
import pandas as pd
import os
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel
import auth, models
import shutil
import tempfile
import time

router = APIRouter(
    prefix="/budgets",
    tags=["budgets"]
)

# Handle path dynamically for Windows/Linux
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
BUDGET_EXCEL_PATH = os.path.join(PROJECT_ROOT, "Presupuestos por cliente.xlsx")

def parse_excel_file():
    print(f"DEBUG: Intentando leer Excel en: {BUDGET_EXCEL_PATH}")
    if not os.path.exists(BUDGET_EXCEL_PATH):
        print(f"DEBUG: El archivo NO existe en la ruta especificada.")
        return {}
            
    temp_path = None
    max_retries = 3
    retry_delay = 0.5
    
    df = None
    for attempt in range(max_retries):
        try:
            temp_dir = tempfile.gettempdir()
            temp_path = os.path.join(temp_dir, f"temp_budgets_{os.getpid()}_{attempt}.xlsx")
            shutil.copy2(BUDGET_EXCEL_PATH, temp_path)
            
            df = pd.read_excel(temp_path, sheet_name=0, header=None)
            if df is not None:
                print(f"DEBUG: Excel leído correctamente. Filas: {len(df)}")
                break
        except Exception as e:
            print(f"DEBUG: Intento {attempt+1} fallido: {e}")
            if attempt == max_retries - 1:
                return {}
            time.sleep(retry_delay)
            if temp_path and os.path.exists(temp_path):
                try: os.remove(temp_path)
                except: pass
    
    if df is None:
        return {}

    try:
        main_headers = list(df.iloc[0].values)
        sub_headers = list(df.iloc[1].values)
        df_data = df.iloc[2:].copy()
        
        current_main = None
        for i in range(2, len(main_headers)):
            val = str(main_headers[i]).strip().lower()
            if val != 'nan' and len(val) > 0:
                current_main = val
            main_headers[i] = current_main
            
        parsed_data = {}
        for index, row in df_data.iterrows():
            client_code = row[0]
            client_name = row[1]
            if pd.isna(client_code) or pd.isna(client_name):
                continue
            
            try:
                if isinstance(client_code, (float, int)):
                    code_str = str(int(client_code))
                else:
                    code_str = str(client_code).strip()
            except:
                code_str = str(client_code).strip()
                
            client_budget = {"client_code": code_str, "client_name": str(client_name), "divisions": {}}
            for i in range(2, len(main_headers)):
                division = str(main_headers[i])
                sub_header = str(sub_headers[i]).strip().lower()
                if division == 'none' or division == 'nan':
                    continue
                
                is_total_column = (i == 2 or main_headers[i] != main_headers[i-1] or sub_header == 'total')
                final_sub_header = "total" if is_total_column else sub_header
                
                val = row[i]
                num_val = 0.0
                if not pd.isna(val) and str(val).strip() != '':
                    try: num_val = float(val)
                    except: pass
                        
                if division not in client_budget["divisions"]:
                    client_budget["divisions"][division] = {}
                if final_sub_header == "total" and "total" in client_budget["divisions"][division]:
                    continue
                client_budget["divisions"][division][final_sub_header] = num_val
                
            parsed_data[code_str] = client_budget
            
        print(f"DEBUG: Proceso finalizado. Clientes parseados: {len(parsed_data)}")
        return parsed_data
    except Exception as e:
        print(f"ERROR procesando datos del Excel: {e}")
        return {}
    finally:
        if temp_path and os.path.exists(temp_path):
            try: os.remove(temp_path)
            except: pass

@router.get("/status")
async def get_budget_status():
    if os.path.exists(BUDGET_EXCEL_PATH):
        return {"has_data": True, "file_exists": True}
    return {"has_data": False, "file_exists": False}

class BudgetFilters(BaseModel):
    year: Optional[int] = None
    company_id: Optional[str] = '2'

@router.post("/client-budgets")
def get_client_budgets(filters: BudgetFilters, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    try:
        budgets_data = parse_excel_file()
        if not budgets_data:
            return {"error": "No se encontraron datos en el Excel o error al leerlo. Verifica los logs del servidor.", "data": []}
            
        year = filters.year or date.today().year
        print(f"DEBUG: Cargando ventas reales para el año {year}")
        
        # Updated query to include month for breakdown
        query = """
            SELECT 
                CodigoCliente, 
                UPPER(RTRIM(LTRIM(Comisionista))) as Comisionista, 
                MesFactura,
                SUM(CAST(BaseImponible AS FLOAT)) as ActualSales 
            FROM Vis_AEL_DiarioFactxComercial 
            WHERE CodigoEmpresa = :empresa AND EjercicioFactura = :year 
            GROUP BY CodigoCliente, UPPER(RTRIM(LTRIM(Comisionista))), MesFactura
        """
        df_actual = pd.read_sql(text(query), db.bind, params={"empresa": filters.company_id, "year": str(year)})
        print(f"DEBUG: SQL devolvió {len(df_actual)} filas de ventas.")
        
        divisions_map = {
            'conectores': ['JOSE CESPEDES BLANCO', 'ANTONIO MACHO MACHO', 'JESUS COLLADO ARAQUE', 'ADRIÁN ROMERO JIMENEZ'],
            'sismecanic': ['JUAN CARLOS BENITO RAMOS', 'JAVIER ALLEN PERKINS'],
            'informatica': ['JUAN CARLOS VALDES ANTON']
        }
        rep_to_div = {rep.upper(): div for div, reps in divisions_map.items() for rep in reps}
        
        # Month mapping for conversion
        month_names_map = {
            1: 'ene', 2: 'feb', 3: 'mar', 4: 'abr', 5: 'may', 6: 'jun',
            7: 'jul', 8: 'ago', 9: 'sep', 10: 'oct', 11: 'nov', 12: 'dic'
        }
        
        # Structure: client_id -> { total: X, divisions: { div -> { total: Y, months: { 'ene' -> Z } } } }
        actual_data = {}
        
        for _, row in df_actual.iterrows():
            try:
                raw_code = row['CodigoCliente']
                if pd.isna(raw_code): continue
                
                client_id = str(int(raw_code)) if isinstance(raw_code, (float, int)) and float(raw_code).is_integer() else str(raw_code).strip()
                div = rep_to_div.get(str(row['Comisionista']), 'otros')
                
                # Robust month handling
                raw_month = row['MesFactura']
                if pd.isna(raw_month): continue
                
                month_idx = int(float(raw_month))
                month_name = month_names_map.get(month_idx)
                amount = float(row['ActualSales'] or 0)
                
                if client_id not in actual_data:
                    actual_data[client_id] = {"total": 0, "divisions": {}}
                
                if div not in actual_data[client_id]["divisions"]:
                    actual_data[client_id]["divisions"][div] = {"total": 0, "months": {}}
                
                actual_data[client_id]["total"] += amount
                actual_data[client_id]["divisions"][div]["total"] += amount
                
                if month_name:
                    actual_data[client_id]["divisions"][div]["months"][month_name] = actual_data[client_id]["divisions"][div]["months"].get(month_name, 0) + amount
            except Exception as e:
                print(f"DEBUG Error procesando fila de ventas: {e}")
                continue

        results = []
        for client_code, budget_info in budgets_data.items():
            client_actuals = actual_data.get(client_code, {"total": 0, "divisions": {}})
            merged_divisions = []
            total_budget = 0
            total_actual = client_actuals["total"]
            
            for div_name, div_budget_data in budget_info.get("divisions", {}).items():
                if div_name == "total": continue
                
                div_total_budget = div_budget_data.get("total", 0)
                total_budget += div_total_budget
                
                norm_div = div_name.lower().strip()
                div_actual_info = client_actuals["divisions"].get(norm_div, {"total": 0, "months": {}})
                div_actual_total = div_actual_info["total"]
                
                # Create monthly breakdown list
                monthly_details = []
                for m_idx in range(1, 13):
                    m_name = month_names_map[m_idx]
                    m_budget = div_budget_data.get(m_name, 0)
                    m_actual = div_actual_info["months"].get(m_name, 0)
                    monthly_details.append({
                        "month": m_name,
                        "budget": m_budget,
                        "actual": m_actual
                    })
                
                merged_divisions.append({
                    "name": div_name.upper(),
                    "budget": div_total_budget,
                    "actual": div_actual_total,
                    "progress": (div_actual_total / div_total_budget * 100) if div_total_budget > 0 else 0,
                    "monthly": monthly_details
                })
                
            results.append({
                "client_code": client_code,
                "client_name": budget_info["client_name"],
                "total_budget": total_budget,
                "total_actual": total_actual,
                "total_progress": (total_actual / total_budget * 100) if total_budget > 0 else 0,
                "divisions": merged_divisions
            })
            
        results.sort(key=lambda x: x["total_budget"], reverse=True)
        print(f"DEBUG: Devolviendo {len(results)} clientes con desglose mensual.")
        return {"data": results}
    except Exception as e:
        print(f"ERROR en endpoint client-budgets: {e}")
        raise HTTPException(status_code=500, detail=str(e))
