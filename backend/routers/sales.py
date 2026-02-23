from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
import auth, models
import pandas as pd
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel
from cachetools import TTLCache
import hashlib
import json

# Cache dashboard results for 5 minutes (300 seconds)
# Useful for fast tab-switching or repeated reloads
dashboard_cache = TTLCache(maxsize=200, ttl=300)

router = APIRouter(
    prefix="/api/sales",
    tags=["sales"]
)

class DashboardFilters(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    company_id: Optional[str] = None
    sales_rep_id: Optional[str] = None
    client_id: Optional[str] = None
    series_id: Optional[str] = None
    division: Optional[str] = None

@router.post("/dashboard")
def get_sales_dashboard(filters: DashboardFilters, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    # Create a deterministic cache key from filters and user context
    filter_dict = filters.dict()
    # Convert dates to strings for JSON serialization
    for k, v in filter_dict.items():
        if isinstance(v, date):
            filter_dict[k] = v.isoformat()
            
    cache_payload = {
        "filters": filter_dict,
        "role": current_user.role,
        "rep": current_user.sales_rep_id
    }
    cache_str = json.dumps(cache_payload, sort_keys=True)
    cache_key = hashlib.md5(cache_str.encode()).hexdigest()

    if cache_key in dashboard_cache:
        return dashboard_cache[cache_key]

    try:
        # Base Query
        # Exclude old/duplicate company 100 (Cenval S.L.)
        query = "SELECT * FROM Vis_AEL_DiarioFactxComercial WHERE CodigoEmpresa <> '100'"
        params = {}

        # --- Filters ---
        # Specific Reps requested by user
        
        # Define Divisions
        divisions = {
            'Conectrónica': ['JOSE CESPEDES BLANCO', 'ANTONIO MACHO MACHO', 'JESUS COLLADO ARAQUE'],
            'Sismecánica': ['JUAN CARLOS BENITO RAMOS', 'JAVIER ALLEN PERKINS'],
            # Informática Industrial has the rest (Juan Carlos Valdes Anton)
            'Informática Industrial': ['JUAN CARLOS VALDES ANTON']
        }
        
        all_allowed_reps = [
            'JOSE CESPEDES BLANCO',
            'JUAN CARLOS BENITO RAMOS',
            'JUAN CARLOS VALDES ANTON',
            'ANTONIO MACHO MACHO',
            'JAVIER ALLEN PERKINS',
            'JESUS COLLADO ARAQUE'
        ]

        # Filter reps by division if selected
        current_allowed_reps = all_allowed_reps
        if filters.division:
            if filters.division in divisions:
                target_reps = divisions[filters.division]
                # Intersection of all allowed and division reps
                current_allowed_reps = [rep for rep in all_allowed_reps if rep in target_reps]
            else:
                 current_allowed_reps = [] # Should not happen if frontend sends correct values

        # ROLE BASED ACCESS CONTROL
        # Consider an admin if string role="admin" OR the user's role_obj is admin.
        has_manage_permission = (current_user.role == "admin") or (
            current_user.role_obj and current_user.role_obj.name == "admin"
        ) or (
            current_user.role_obj and current_user.role_obj.can_manage_users
        )
        if not has_manage_permission and current_user.sales_rep_id:
            current_allowed_reps = [rep for rep in current_allowed_reps if rep == current_user.sales_rep_id.upper()]
            # Force the filter so it overrides frontend requests
            filters.sales_rep_id = current_user.sales_rep_id.upper()

        
        # We need to filter by names because IDs are not provided in the request
        # Assuming 'Comisionista' column holds the names. Trim and upper for safety.
        # This is a bit inefficient if we could use IDs, but safe for now.
        
        # Manually construct IN clause to avoid pyodbc TVP issues with tuples
        if current_allowed_reps:
            placeholders = [f":rep_{i}" for i in range(len(current_allowed_reps))]
            query += f" AND UPPER(RTRIM(LTRIM(Comisionista))) IN ({', '.join(placeholders)})"
            
            for i, rep in enumerate(current_allowed_reps):
                params[f'rep_{i}'] = rep
        else:
            # If no reps match (e.g. invalid division), return no results
            query += " AND 1=0"

        if filters.start_date:
            query += " AND FechaFactura >= :start_date"
            params['start_date'] = filters.start_date
        
        if filters.end_date:
            query += " AND FechaFactura <= :end_date"
            params['end_date'] = filters.end_date
            
        if filters.company_id:
            query += " AND CodigoEmpresa = :company_id"
            params['company_id'] = filters.company_id
            
        if filters.sales_rep_id:
            # If a specific rep is selected, we filter by that ONE (ID or Name)
            # The frontend should likely send the NAME if we don't have IDs mapped yet.
            # For now, let's assume sales_rep_id is the NAME string from the dropdown.
            query += " AND UPPER(RTRIM(LTRIM(Comisionista))) = :sales_rep_id"
            params['sales_rep_id'] = filters.sales_rep_id

        if filters.client_id:
            query += " AND CodigoCliente = :client_id"
            params['client_id'] = filters.client_id
            

        # Execute Query into Pandas DataFrame
        df = pd.read_sql(text(query), db.bind, params=params)

        # --- NEW: Pending Invoices Logic (Moved Up) ---
        total_pending_amount = 0.0
        pending_map = {}
        
        try:
            # 1. Get Comisionista ID -> Name Mapping
            rep_map_query = "SELECT CodigoComisionista, UPPER(RTRIM(LTRIM(Comisionista))) as Comisionista FROM Comisionistas"
            rep_map_df = pd.read_sql(text(rep_map_query), db.bind)
            rep_map = dict(zip(rep_map_df['CodigoComisionista'].astype(str), rep_map_df['Comisionista']))

            # 2. Query Pending Albaranes
            pending_query = """
                SELECT 
                    k.CodigoComisionista, k.ImporteComision,
                    k.CodigoComisionista2_, k.ImporteComision2_,
                    k.CodigoComisionista3_, k.ImporteComision3_,
                    k.CodigoComisionista4_, k.ImporteComision4_,
                    c.RazonSocial,
                    k.ImporteLiquido
                FROM CabeceraAlbaranCliente k
                JOIN Clientes c ON k.CodigoCliente = c.CodigoCliente AND k.CodigoEmpresa = c.CodigoEmpresa
                WHERE k.StatusFacturado = 0
                AND k.ImporteLiquido > 100
                AND k.CodigoEmpresa <> '100'
            """
            
            pending_params = {}
            if filters.company_id:
                pending_query += " AND k.CodigoEmpresa = :company_id"
                pending_params['company_id'] = filters.company_id
                
            df_pending = pd.read_sql(text(pending_query), db.bind, params=pending_params)
            
            if not df_pending.empty:
                # Calculate Total for KPI
                total_pending_amount = float(df_pending['ImporteLiquido'].sum())

                # 3. Determine correct Rep ID
                def get_target_rep_id(row):
                    if row['ImporteComision'] and row['ImporteComision'] != 0: return str(row['CodigoComisionista'])
                    if row['ImporteComision2_'] and row['ImporteComision2_'] != 0: return str(row['CodigoComisionista2_'])
                    if row['ImporteComision3_'] and row['ImporteComision3_'] != 0: return str(row['CodigoComisionista3_'])
                    if row['ImporteComision4_'] and row['ImporteComision4_'] != 0: return str(row['CodigoComisionista4_'])
                    return str(row['CodigoComisionista'])

                df_pending['TargetRepID'] = df_pending.apply(get_target_rep_id, axis=1)
                
                # 4. Map ID to Name
                df_pending['Comisionista'] = df_pending['TargetRepID'].map(rep_map).fillna('UNKNOWN')
                df_pending = df_pending[df_pending['Comisionista'] != 'UNKNOWN']

                # 5. Group for Chart Tooltips
                pending_map = df_pending.groupby('Comisionista')[['RazonSocial', 'ImporteLiquido']].apply(
                    lambda x: x.nlargest(5, 'ImporteLiquido').to_dict('records')
                ).to_dict()

        except Exception as e:
            print(f"Error fetching pending invoices: {e}")
            pass

        if df.empty:
            return {
                "kpis": {
                    "revenue": 0,
                    "commission": 0,
                    "pending_invoice": total_pending_amount, # Added
                    "clients": 0,
                    "invoices": 0
                },
                "charts": {
                    "sales_by_rep": [],
                    "sales_by_day": [],
                    "commission_dist": [],
                    "top_clients": []
                }
            }

        # --- KPIs ---
        total_revenue = float(df['BaseImponible'].sum())
        total_commission = float(df['ImporteComision'].sum())
        unique_clients = int(df['CodigoCliente'].nunique())
        unique_invoices = int(df['NumeroFactura'].nunique())

        # --- Charts ---

        # 1. Sales by Rep (Bar Chart)
        sales_by_rep_df = df.groupby('Comisionista')['BaseImponible'].sum().reset_index()
        sales_by_rep_df = sales_by_rep_df.sort_values(by='BaseImponible', ascending=False)
        sales_by_rep_data = sales_by_rep_df.to_dict(orient='records')
        
        # Attach pending invoices to reps
        for item in sales_by_rep_data:
            rep_name = item['Comisionista'].strip().upper() if item['Comisionista'] else ""
            if rep_name in pending_map:
                 item['pending_invoices'] = pending_map[rep_name]
            else:
                 item['pending_invoices'] = []

        # 2. Sales by Day (Line Chart) with Calendar Fill
        # Ensure FechaFactura is datetime
        df['FechaFactura'] = pd.to_datetime(df['FechaFactura'])
        sales_by_day = df.groupby(df['FechaFactura'].dt.date)['BaseImponible'].sum()
        
        # Create full date range if we have filters, otherwise use min/max from data
        start = filters.start_date if filters.start_date else df['FechaFactura'].min().date()
        end = filters.end_date if filters.end_date else df['FechaFactura'].max().date()
        
        if start and end:
            idx = pd.date_range(start, end)
            sales_by_day.index = pd.DatetimeIndex(sales_by_day.index)
            sales_by_day = sales_by_day.reindex(idx, fill_value=0)
        
        sales_by_day_data = [{'date': date.strftime('%Y-%m-%d'), 'amount': val} for date, val in sales_by_day.items()]

        # 3. Commission Distribution (Donut Chart)
        # Groupping by %Comision
        comm_dist = df.groupby('%Comision')['BaseImponible'].sum().reset_index()
        comm_dist.columns = ['percentage', 'amount']
        comm_dist_data = comm_dist.to_dict(orient='records')

        # 4. Top 15 Clients (Table)
        # Group by Client ID and Name
        client_metrics = df.groupby(['CodigoCliente', 'RazonSocial']).agg(
            revenue=('BaseImponible', 'sum'),
            orders=('NumeroFactura', 'nunique') # distinct invoices
        ).reset_index()
        
        client_metrics['ticket_avg'] = client_metrics['revenue'] / client_metrics['orders']
        client_metrics = client_metrics.sort_values(by='revenue', ascending=False).head(15)
        top_clients_data = client_metrics.to_dict(orient='records')

        result = {
            "kpis": {
                "revenue": total_revenue,
                "commission": total_commission,
                "pending_invoice": total_pending_amount,
                "clients": unique_clients,
                "invoices": unique_invoices
            },
            "charts": {
                "sales_by_rep": sales_by_rep_data,
                "sales_by_day": sales_by_day_data,
                "commission_dist": comm_dist_data,
                "top_clients": top_clients_data
            }
        }
        
        dashboard_cache[cache_key] = result
        return result

    except Exception as e:
        # print error to console for debugging
        print(f"Error in dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class ComparisonFilters(BaseModel):
    start_year: int
    end_year: int
    division: Optional[str] = None
    sales_rep_id: Optional[str] = None

@router.post("/comparison")
def get_sales_comparison(filters: ComparisonFilters, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    try:
        combined_data = []
        
        # Define Allowed Reps Logic (Shared with Dashboard)
        divisions = {
            'Conectrónica': ['JOSE CESPEDES BLANCO', 'ANTONIO MACHO MACHO', 'JESUS COLLADO ARAQUE'],
            'Sismecánica': ['JUAN CARLOS BENITO RAMOS', 'JAVIER ALLEN PERKINS'],
            'Informática Industrial': ['JUAN CARLOS VALDES ANTON']
        }
        all_allowed_reps = [
            'JOSE CESPEDES BLANCO',
            'JUAN CARLOS BENITO RAMOS',
            'JUAN CARLOS VALDES ANTON',
            'ANTONIO MACHO MACHO',
            'JAVIER ALLEN PERKINS',
            'JESUS COLLADO ARAQUE'
        ]

        # Determine target reps
        current_allowed_reps = all_allowed_reps
        if filters.division:
            if filters.division in divisions:
                target_reps = divisions[filters.division]
                current_allowed_reps = [rep for rep in all_allowed_reps if rep in target_reps]
            else:
                 current_allowed_reps = []

        if filters.sales_rep_id:
             current_allowed_reps = [r for r in current_allowed_reps if r == filters.sales_rep_id]

        # Consider an admin if string role="admin" OR the user's role_obj is admin.
        has_manage_permission = (current_user.role == "admin") or (
            current_user.role_obj and current_user.role_obj.name == "admin"
        ) or (
            current_user.role_obj and current_user.role_obj.can_manage_users
        )
        if not has_manage_permission and current_user.sales_rep_id:
            current_allowed_reps = [r for r in current_allowed_reps if r == current_user.sales_rep_id.upper()]
            filters.sales_rep_id = current_user.sales_rep_id.upper()

        if not current_allowed_reps:
            return {"comparison": []}


        # Loop through each year requested
        for year in range(filters.start_year, filters.end_year + 1):
            
            # CRITICAL LOGIC: Company Split
            # < 2025 -> Company 100
            # >= 2025 -> Company 2
            target_company = '100' if year < 2025 else '2'
            
            query = """
                SELECT Comisionista, SUM(BaseImponible) as TotalSales 
                FROM Vis_AEL_DiarioFactxComercial 
                WHERE YEAR(FechaFactura) = :year 
                AND CodigoEmpresa = :company_id
            """
            params = {'year': year, 'company_id': target_company}
            
            # Add Rep Filter
            placeholders = [f":rep_{i}" for i in range(len(current_allowed_reps))]
            query += f" AND UPPER(RTRIM(LTRIM(Comisionista))) IN ({', '.join(placeholders)})"
            for i, rep in enumerate(current_allowed_reps):
                params[f'rep_{i}'] = rep
            
            query += " GROUP BY Comisionista"
            
            df = pd.read_sql(text(query), db.bind, params=params)
            
            if not df.empty:
                for _, row in df.iterrows():
                    combined_data.append({
                        "name": row['Comisionista'],
                        "year": year,
                        "sales": float(row['TotalSales'])
                    })
            # If empty for a year, we might want to fill with 0s later or handle in frontend

        # Pivot data for easier frontend consumption
        # Structure: [{name: 'Rep 1', 2023: 100, 2024: 200}, ...]
        by_rep_data = []
        if combined_data:
            df_combined = pd.DataFrame(combined_data)
            pivot_df = df_combined.pivot(index='name', columns='year', values='sales').fillna(0).reset_index()
            by_rep_data = pivot_df.to_dict(orient='records')

        # --- NEW: Monthly Evolution Data ---
        monthly_data = []
        
        for year in range(filters.start_year, filters.end_year + 1):
             target_company = '100' if year < 2025 else '2'
             
             # Group by Month for the entire selection (filtered by reps above)
             query_monthly = """
                SELECT MONTH(FechaFactura) as Mes, SUM(BaseImponible) as TotalSales 
                FROM Vis_AEL_DiarioFactxComercial 
                WHERE YEAR(FechaFactura) = :year 
                AND CodigoEmpresa = :company_id
             """
             params_m = {'year': year, 'company_id': target_company}

             # Reuse rep filtering
             if current_allowed_reps:
                placeholders = [f":rep_{i}" for i in range(len(current_allowed_reps))]
                query_monthly += f" AND UPPER(RTRIM(LTRIM(Comisionista))) IN ({', '.join(placeholders)})"
                for i, rep in enumerate(current_allowed_reps):
                    params_m[f'rep_{i}'] = rep
             else:
                query_monthly += " AND 1=0"
            
             query_monthly += " GROUP BY MONTH(FechaFactura) ORDER BY Mes"
             
             df_m = pd.read_sql(text(query_monthly), db.bind, params=params_m)
             
             if not df_m.empty:
                 for _, row in df_m.iterrows():
                     monthly_data.append({
                         "month": int(row['Mes']),
                         "year": year,
                         "sales": float(row['TotalSales'])
                     })
        
        by_month_data = []
        if monthly_data:
            df_monthly = pd.DataFrame(monthly_data)
            # Pivot: Index=Month, Columns=Year
            pivot_monthly = df_monthly.pivot(index='month', columns='year', values='sales').fillna(0).reset_index()
            by_month_data = pivot_monthly.to_dict(orient='records')
            
            # Ensure all 12 months exist
            existing_months = set(d['month'] for d in by_month_data)
            for m in range(1, 13):
                if m not in existing_months:
                    empty_record = {'month': m}
                    for year in range(filters.start_year, filters.end_year + 1):
                        empty_record[year] = 0.0
                    by_month_data.append(empty_record)
            
            by_month_data.sort(key=lambda x: x['month'])


        return {
            "by_rep": by_rep_data,
            "by_month": by_month_data
        }

    except Exception as e:
        print(f"Error in comparison: {e}")
        raise HTTPException(status_code=500, detail=str(e))
