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

BUDGET_EXCEL_PATH = r"c:\Users\adrian.rubio\OneDrive - CENVAL S.L\Escritorio\repositorios\Data_Management\Presupuestos por cliente.xlsx"

def parse_excel_file():
    if not os.path.exists(BUDGET_EXCEL_PATH):
        return {}
            
    temp_path = None
    max_retries = 3
    retry_delay = 0.5 # seconds
    
    df = None
    for attempt in range(max_retries):
        try:
            temp_dir = tempfile.gettempdir()
            temp_path = os.path.join(temp_dir, f"temp_budgets_{os.getpid()}_{attempt}.xlsx")
            shutil.copy2(BUDGET_EXCEL_PATH, temp_path)
            
            df = pd.read_excel(temp_path, sheet_name=0, header=None)
            if df is not None:
                break
        except Exception as e:
            if attempt == max_retries - 1:
                print(f"ERROR parsing Excel after {max_retries} attempts: {e}")
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
                
            client_budget = {
                "client_code": code_str,
                "client_name": str(client_name),
                "divisions": {}
            }
            
            for i in range(2, len(main_headers)):
                division = str(main_headers[i])
                sub_header = str(sub_headers[i]).strip().lower()
                
                if division == 'none' or division == 'nan':
                    continue
                
                # Logic to identify the "total" column for the division
                is_total_column = False
                # 1. It's the first column of the section
                if i == 2 or main_headers[i] != main_headers[i-1]:
                    is_total_column = True
                # 2. It's explicitly named "total"
                elif sub_header == 'total':
                    is_total_column = True
                
                final_sub_header = sub_header
                if is_total_column:
                    final_sub_header = "total"
                    
                val = row[i]
                num_val = 0.0
                if not pd.isna(val) and str(val).strip() != '':
                    try:
                        num_val = float(val)
                    except:
                        pass
                        
                if division not in client_budget["divisions"]:
                    client_budget["divisions"][division] = {}
                
                # Only store the first "total" found for a division to avoid 
                # grand total columns (like index 41) from overwriting specific division totals.
                if final_sub_header == "total" and "total" in client_budget["divisions"][division]:
                    continue
                    
                client_budget["divisions"][division][final_sub_header] = num_val
                
            parsed_data[code_str] = client_budget
            
        return parsed_data
    except Exception as e:
        print(f"ERROR processing data: {e}")
        return {}
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass

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
        # 1. Load Budget Data directly from Excel
        budgets_data = parse_excel_file()
        
        if not budgets_data:
            return {"error": "No budget data found or error reading Excel file.", "data": []}
            
        # 2. Get Actual Sales Data
        year = filters.year or date.today().year
        
        query = """
            SELECT CodigoCliente, UPPER(RTRIM(LTRIM(Comisionista))) as Comisionista, SUM(CAST(BaseImponible AS FLOAT)) as ActualSales
            FROM Vis_AEL_DiarioFactxComercial
            WHERE CodigoEmpresa = :empresa AND EjercicioFactura = :year
            GROUP BY CodigoCliente, UPPER(RTRIM(LTRIM(Comisionista)))
        """
        
        df_actual = pd.read_sql(text(query), db.bind, params={"empresa": filters.company_id, "year": str(year)})
        
        # Mapping divisions conceptually like in sales.py
        divisions_map = {
            'conectores': ['JOSE CESPEDES BLANCO', 'ANTONIO MACHO MACHO', 'JESUS COLLADO ARAQUE', 'ADRIÁN ROMERO JIMENEZ'],
            'sismecanic': ['JUAN CARLOS BENITO RAMOS', 'JAVIER ALLEN PERKINS'],
            'informatica': ['JUAN CARLOS VALDES ANTON']
        }
        
        # Reverse map for quick lookup
        rep_to_div = {}
        for div, reps in divisions_map.items():
            for rep in reps:
                rep_to_div[rep.upper()] = div
                
        # 3. Aggregate actual sales by client and division
        actual_sales_dict = {} # client_code -> { division -> amount }
        
        for _, row in df_actual.iterrows():
            client_id = str(int(row['CodigoCliente'])) if isinstance(row['CodigoCliente'], float) and row['CodigoCliente'].is_integer() else str(row['CodigoCliente'])
            rep = str(row['Comisionista'])
            amount = float(row['ActualSales'] or 0)
            
            div = rep_to_div.get(rep, 'otros')
            
            if client_id not in actual_sales_dict:
                actual_sales_dict[client_id] = {"total": 0}
                
            if div not in actual_sales_dict[client_id]:
                actual_sales_dict[client_id][div] = 0
                
            actual_sales_dict[client_id][div] += amount
            actual_sales_dict[client_id]["total"] += amount

        # 4. Merge Budget and Actuals
        results = []
        for client_code, budget_info in budgets_data.items():
            client_actuals = actual_sales_dict.get(client_code, {})
            
            merged_divisions = []
            total_budget = 0
            total_actual = client_actuals.get("total", 0)
            
            for div_name, div_budget_data in budget_info.get("divisions", {}).items():
                div_total_budget = div_budget_data.get("total", 0)
                
                if div_name == "total":
                    continue
                    
                total_budget += div_total_budget
                
                norm_div = div_name.lower().strip()
                div_actual = client_actuals.get(norm_div, 0)
                progress = (div_actual / div_total_budget * 100) if div_total_budget > 0 else 0
                
                merged_divisions.append({
                    "name": div_name.upper(),
                    "budget": div_total_budget,
                    "actual": div_actual,
                    "progress": progress
                })
                
            total_progress = (total_actual / total_budget * 100) if total_budget > 0 else 0
            
            results.append({
                "client_code": client_code,
                "client_name": budget_info["client_name"],
                "total_budget": total_budget,
                "total_actual": total_actual,
                "total_progress": total_progress,
                "divisions": merged_divisions
            })
            
        results.sort(key=lambda x: x["total_budget"], reverse=True)
            
        return {"data": results}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
