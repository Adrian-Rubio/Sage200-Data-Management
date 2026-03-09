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

class InvoiceFilters(DashboardFilters):
    page: Optional[int] = 1
    page_size: Optional[int] = 20

class GeographyFilters(DashboardFilters):
    scope: str = "nacional"

class RegionDetailFilters(GeographyFilters):
    region: str

@router.post("/dashboard")
def get_sales_dashboard(filters: DashboardFilters, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    # Create a deterministic cache key from filters and user context
    filter_dict = filters.dict()
    for k, v in filter_dict.items():
        if isinstance(v, date):
            filter_dict[k] = v.isoformat()
            
    cache_payload = {
        "filters": filter_dict,
        "role": current_user.role,
        "rep": current_user.sales_rep_id,
        "v": 11 # Version 11: Clear stale cache after fix
    }
    cache_str = json.dumps(cache_payload, sort_keys=True)
    cache_key = hashlib.md5(cache_str.encode()).hexdigest()

    if cache_key in dashboard_cache:
        return dashboard_cache[cache_key]

    try:
        # Division Mapping
        divisions = {
            'Conectrónica': ['JOSE CESPEDES BLANCO', 'ANTONIO MACHO MACHO', 'JESUS COLLADO ARAQUE', 'ADRIÁN ROMERO JIMENEZ'],
            'Sismecánica': ['JUAN CARLOS BENITO RAMOS', 'JAVIER ALLEN PERKINS'],
            'Informática Industrial': ['JUAN CARLOS VALDES ANTON']
        }
        
        all_reps = [r for reps in divisions.values() for r in reps]

        # Filter reps by division if selected
        current_allowed_reps = all_reps
        if filters.division:
            if filters.division in divisions:
                current_allowed_reps = divisions[filters.division]
            else:
                current_allowed_reps = []

        # RBAC
        has_manage_permission = (current_user.role == "admin") or (
            current_user.role_obj and current_user.role_obj.name == "admin"
        ) or (
            current_user.role_obj and current_user.role_obj.can_manage_users
        )
        if not has_manage_permission and current_user.sales_rep_id:
            current_allowed_reps = [rep for rep in current_allowed_reps if rep == current_user.sales_rep_id.upper()]

        # Shared filter strings and params
        common_where = ""
        common_rev_where = "" # Specially for revenue if needed
        common_params = {}

        # 2025+ is Company 2 only as per user request
        company_filter = "CodigoEmpresa = '2'"
        
        if current_allowed_reps:
            placeholders = [f":rep_{i}" for i in range(len(current_allowed_reps))]
            common_where += f" AND UPPER(RTRIM(LTRIM(Comisionista))) IN ({', '.join(placeholders)})"
            for i, rep in enumerate(current_allowed_reps):
                common_params[f'rep_{i}'] = rep
        else:
            common_where += " AND 1=0"

        if filters.start_date:
            common_where += " AND TRY_CONVERT(date, FechaFactura) >= :start_date"
            common_params['start_date'] = filters.start_date
        if filters.end_date:
            common_where += " AND TRY_CONVERT(date, FechaFactura) <= :end_date"
            common_params['end_date'] = filters.end_date
        if filters.sales_rep_id:
            common_where += " AND UPPER(RTRIM(LTRIM(Comisionista))) = :sales_rep_id_f"
            common_params['sales_rep_id_f'] = filters.sales_rep_id.upper()
        if filters.client_id:
            common_where += " AND CodigoCliente = :client_id"
            common_params['client_id'] = filters.client_id

        # --- QUERY 1: REVENUE (Diario) ---
        query_rev = f"SELECT * FROM Vis_AEL_DiarioFactxComercial WHERE {company_filter} {common_where}"
        with open("dashboard_debug.log", "a") as f:
            f.write(f"\n--- {date.today()} ---\n")
            f.write(f"DEBUG: Revenue Query: {query_rev}\n")
            f.write(f"DEBUG: Params: {common_params}\n")
        df_rev = pd.read_sql(text(query_rev), db.bind, params=common_params)
        with open("dashboard_debug.log", "a") as f:
            f.write(f"DEBUG: df_rev size: {df_rev.shape}\n")
            f.write(f"DEBUG: df_rev revenue sum: {df_rev['BaseImponible'].sum() if not df_rev.empty else 0}\n")

        # --- QUERY 2: MARGIN (VIS_CEN_LinAlbFacSD) ---
        query_marg = f"SELECT * FROM VIS_CEN_LinAlbFacSD WHERE {company_filter} {common_where}"
        with open("dashboard_debug.log", "a") as f:
            f.write(f"DEBUG: Margin Query: {query_marg}\n")
        df_marg = pd.read_sql(text(query_marg), db.bind, params=common_params)
        with open("dashboard_debug.log", "a") as f:
            f.write(f"DEBUG: df_marg size: {df_marg.shape}\n")
            f.write(f"DEBUG: df_marg sum: {df_marg['BaseImponible'].sum() if not df_marg.empty else 0}\n")
        
        # Ensure correct types and column names (Normalization)
        for df_tmp in [df_rev, df_marg]:
            if not df_tmp.empty:
                df_tmp.columns = [c.strip() for c in df_tmp.columns]
                if 'BaseImponible' in df_tmp.columns:
                    df_tmp['BaseImponible'] = pd.to_numeric(df_tmp['BaseImponible'], errors='coerce').fillna(0)
                if 'ImporteCoste' in df_tmp.columns:
                    df_tmp['ImporteCoste'] = pd.to_numeric(df_tmp['ImporteCoste'], errors='coerce').fillna(0)
                if 'FechaFactura' in df_tmp.columns:
                    df_tmp['FechaFactura'] = pd.to_datetime(df_tmp['FechaFactura'], errors='coerce')

        # --- PENDING INVOICES ---
        total_pending_amount = 0.0
        pending_map = {}
        try:
            # We want to apply as many filters as possible to "Pdte. Facturar"
            p_params = common_params.copy()
            p_where = f"WHERE k.StatusFacturado = 0 AND {company_filter.replace('CodigoEmpresa', 'k.CodigoEmpresa')}"
            
            if filters.start_date:
                p_where += " AND TRY_CONVERT(date, k.FechaAlbaran) >= :start_date"
            if filters.end_date:
                p_where += " AND TRY_CONVERT(date, k.FechaAlbaran) <= :end_date"
            if filters.client_id:
                p_where += " AND k.CodigoCliente = :client_id"
            
            p_query = f"""
                SELECT k.ImporteLiquido, c.RazonSocial, com.Comisionista 
                FROM CabeceraAlbaranCliente k 
                JOIN Clientes c ON k.CodigoCliente = c.CodigoCliente AND k.CodigoEmpresa = c.CodigoEmpresa 
                JOIN Comisionistas com ON k.CodigoComisionista = com.CodigoComisionista 
                {p_where}
            """
            
            # Apply Rep filtering
            if current_allowed_reps:
                placeholders = [f":rep_{i}" for i in range(len(current_allowed_reps))]
                p_query += f" AND UPPER(RTRIM(LTRIM(com.Comisionista))) IN ({', '.join(placeholders)})"
            
            if filters.sales_rep_id:
                # Re-use sales_rep_id_f from common_params if it exists, else set it
                if 'sales_rep_id_f' not in p_params:
                    p_params['sales_rep_id_f'] = filters.sales_rep_id.upper()
                p_query += " AND UPPER(RTRIM(LTRIM(com.Comisionista))) = :sales_rep_id_f"

            df_pending_raw = pd.read_sql(text(p_query), db.bind, params=p_params)
            
            if not df_pending_raw.empty:
                total_pending_amount = float(df_pending_raw['ImporteLiquido'].sum())
                df_pending_raw['Comisionista'] = df_pending_raw['Comisionista'].str.strip().str.upper()
                
                # Group by client first to sum multiple pending albaranes for the same client
                df_grouped = df_pending_raw.groupby(['Comisionista', 'RazonSocial'], as_index=False)['ImporteLiquido'].sum()
                
                pending_map = {}
                for rep, group in df_grouped.groupby('Comisionista'):
                    pending_map[rep] = group.nlargest(5, 'ImporteLiquido')[['RazonSocial', 'ImporteLiquido']].to_dict('records')
        except Exception as e:
            with open("dashboard_debug.log", "a") as f:
                f.write(f"DEBUG: Pending query error: {e}\n")

        if df_rev.empty and df_marg.empty and df_pending_raw.empty:
            with open("dashboard_debug.log", "a") as f:
                f.write("DEBUG: ALL DFS EMPTY\n")
            return {"kpis": {"revenue": 0, "sales_margin": 0, "pending_invoice": 0, "clients": 0, "invoices": 0}, "charts": {"sales_by_rep": [], "sales_by_day": [], "sales_margin_evolution": [], "top_clients": [], "orders_list": []}}

        # --- CALCULATIONS REVENUE ---
        total_revenue = float(df_rev['BaseImponible'].sum()) if not df_rev.empty else 0.0
        total_gross = float(df_rev[df_rev['BaseImponible'] > 0]['BaseImponible'].sum()) if not df_rev.empty else 0.0
        total_returns = float(df_rev[df_rev['BaseImponible'] < 0]['BaseImponible'].sum()) if not df_rev.empty else 0.0
        
        unique_clients = int(df_rev['CodigoCliente'].nunique()) if not df_rev.empty else 0
        unique_invoices = int(df_rev['NumeroFactura'].nunique()) if not df_rev.empty else 0

        # Sales by Rep (Using Gross for the main chart to avoid negative bars as requested)
        sales_by_rep_data = []
        if not df_rev.empty:
            # We show Gross Revenue in the main bar chart to avoid the "downwards" bars
            s_rep = df_rev.groupby('Comisionista')['BaseImponible'].apply(lambda x: x[x>0].sum()).reset_index().sort_values('Comisionista', ascending=True)
            s_rep.columns = ['Comisionista', 'BaseImponible']
            sales_by_rep_data = s_rep.to_dict(orient='records')
            for item in sales_by_rep_data:
                item['pending_invoices'] = pending_map.get(item['Comisionista'].strip().upper(), [])
                # Add division information for coloring
                rep_name = item['Comisionista'].strip().upper()
                item['division'] = next((k for k, v in divisions.items() if rep_name in (r.upper() for r in v)), 'Otros')

        # Sales by Day (Using Gross to avoid "downwards" bars)
        sales_by_day_data = []
        if not df_rev.empty:
            df_rev['FechaFactura'] = pd.to_datetime(df_rev['FechaFactura'])
            # Sum only positive values for the main chart
            s_day = df_rev.groupby(df_rev['FechaFactura'].dt.date)['BaseImponible'].apply(lambda x: x[x>0].sum())
            start = filters.start_date or df_rev['FechaFactura'].min().date()
            end = filters.end_date or df_rev['FechaFactura'].max().date()
            if start and end:
                idx = pd.date_range(start, end)
                s_day.index = pd.DatetimeIndex(s_day.index)
                s_day = s_day.reindex(idx, fill_value=0)
            sales_by_day_data = [{'date': d.strftime('%Y-%m-%d'), 'amount': v} for d, v in s_day.items()]

        # Top Clients
        top_clients_data = []
        if not df_rev.empty:
            c_met = df_rev.groupby(['CodigoCliente', 'RazonSocial']).agg(revenue=('BaseImponible', 'sum'), orders=('NumeroFactura', 'nunique')).reset_index()
            c_met['ticket_avg'] = c_met['revenue'] / c_met['orders']
            top_clients_data = c_met.sort_values('revenue', ascending=False).head(15).to_dict(orient='records')

        # --- CALCULATIONS MARGIN ---
        global_margin_pct = 0.0
        margin_evolution_data = []
        if not df_marg.empty:
            m_sum = df_marg['BaseImponible'].sum()
            m_cost = df_marg['ImporteCoste'].sum()
            if m_sum > 0:
                global_margin_pct = round(float((m_sum - m_cost) / m_sum * 100), 2)
            
            # Margin Evolution (Lines)
            df_marg['FechaFactura'] = pd.to_datetime(df_marg['FechaFactura'])
            df_marg['Division'] = df_marg['Comisionista'].apply(lambda x: next((k for k, v in divisions.items() if str(x).strip().upper() in (r.upper() for r in v)), 'Otros'))
            
            # Grouping Granularity based on date range
            days_diff = 0
            if filters.start_date and filters.end_date:
                days_diff = (filters.end_date - filters.start_date).days
            
            # If range is less than 90 days, show daily/weekly trend to get a "line"
            # If more, show monthly
            if days_diff <= 90:
                df_marg['Periodo'] = df_marg['FechaFactura'].dt.strftime('%Y-%m-%d')
            else:
                df_marg['Periodo'] = df_marg['FechaFactura'].dt.strftime('%Y-%m')
            
            m_evol = df_marg.groupby(['Periodo', 'Division']).agg(
                ventas=('BaseImponible', 'sum'),
                costes=('ImporteCoste', 'sum')
            ).reset_index()
            m_evol['margin'] = ((m_evol['ventas'] - m_evol['costes']) / m_evol['ventas'] * 100).fillna(0)
            
            # Pivot for Recharts
            pivot_evol = m_evol.pivot(index='Periodo', columns='Division', values='margin').fillna(0).reset_index()
            # Ensure chronological order
            pivot_evol = pivot_evol.sort_values('Periodo')
            margin_evolution_data = pivot_evol.to_dict(orient='records')

        # --- INVOICES LIST ---
        invoices_list = []
        try:
            inv_params = common_params.copy()
            inv_params['company_id'] = company_filter.split('=')[1].strip().replace("'", "") # Extract company_id from company_filter
            inv_where = f"WHERE CodigoEmpresa = :company_id"
            
            if filters.start_date:
                inv_where += " AND TRY_CONVERT(date, FechaFactura) >= :start_date"
            if filters.end_date:
                inv_where += " AND TRY_CONVERT(date, FechaFactura) <= :end_date"
            if filters.client_id:
                inv_where += " AND CodigoCliente = :client_id"
            
            inv_query = f"""
                SELECT TOP 100
                    NumeroFactura, 
                    FechaFactura, 
                    CodigoCliente,
                    RazonSocial as Cliente, 
                    Comisionista,
                    BaseImponible as TotalBase
                FROM Vis_AEL_DiarioFactxComercial
                {inv_where}
            """
            
            # Apply Rep filtering
            if current_allowed_reps:
                placeholders = [f":rep_{i}" for i in range(len(current_allowed_reps))]
                inv_query += f" AND UPPER(RTRIM(LTRIM(Comisionista))) IN ({', '.join(placeholders)})"
            
            if filters.sales_rep_id:
                if 'rep_f' not in inv_params:
                    inv_params['rep_f'] = filters.sales_rep_id.upper()
                inv_query += " AND UPPER(RTRIM(LTRIM(Comisionista))) = :rep_f"
                
            inv_query += " ORDER BY FechaFactura DESC"
            
            df_inv = pd.read_sql(text(inv_query), db.bind, params=inv_params)
            if not df_inv.empty:
                df_inv['FechaFactura'] = pd.to_datetime(df_inv['FechaFactura']).dt.strftime('%Y-%m-%d')
                invoices_list = df_inv.to_dict(orient='records')
        except Exception as e:
            with open("dashboard_debug.log", "a") as f:
                f.write(f"DEBUG: Invoices query error: {e}\n")

        result = {
            "kpis": {
                "revenue": total_revenue,
                "revenue_gross": total_gross,
                "returns": total_returns,
                "sales_margin": global_margin_pct,
                "pending_invoice": total_pending_amount,
                "clients": unique_clients,
                "invoices": unique_invoices
            },
            "charts": {
                "sales_by_rep": sales_by_rep_data,
                "sales_by_day": sales_by_day_data,
                "sales_margin_evolution": margin_evolution_data,
                "top_clients": top_clients_data,
                "invoices_list": invoices_list
            }
        }
        
        dashboard_cache[cache_key] = result
        return result


    except Exception as e:
        print(f"Error in dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/invoices")
def get_paginated_invoices(filters: InvoiceFilters, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    try:
        # Re-use logic for allowed reps
        divisions = {
            'Conectrónica': ['JOSE CESPEDES BLANCO', 'ANTONIO MACHO MACHO', 'JESUS COLLADO ARAQUE', 'ADRIÁN ROMERO JIMENEZ'],
            'Sismecánica': ['JUAN CARLOS BENITO RAMOS', 'JAVIER ALLEN PERKINS'],
            'Informática Industrial': ['JUAN CARLOS VALDES ANTON']
        }
        all_reps = [r for reps in divisions.values() for r in reps]
        
        current_allowed_reps = all_reps
        if filters.division:
            current_allowed_reps = divisions.get(filters.division, [])

        has_manage_permission = (current_user.role == "admin") or (
            current_user.role_obj and current_user.role_obj.name == "admin"
        ) or (
            current_user.role_obj and current_user.role_obj.can_manage_users
        )
        if not has_manage_permission and current_user.sales_rep_id:
            current_allowed_reps = [rep for rep in current_allowed_reps if rep == current_user.sales_rep_id.upper()]

        # Build query
        params = {'company_id': '2'} # Fixed to 2 as per user request for 2025+
        where_clause = "WHERE CodigoEmpresa = :company_id"
        
        if current_allowed_reps:
            placeholders = [f":rep_{i}" for i in range(len(current_allowed_reps))]
            where_clause += f" AND UPPER(RTRIM(LTRIM(Comisionista))) IN ({', '.join(placeholders)})"
            for i, rep in enumerate(current_allowed_reps):
                params[f'rep_{i}'] = rep
        else:
            where_clause += " AND 1=0"

        if filters.start_date:
            where_clause += " AND TRY_CONVERT(date, FechaFactura) >= :start_date"
            params['start_date'] = filters.start_date
        if filters.end_date:
            where_clause += " AND TRY_CONVERT(date, FechaFactura) <= :end_date"
            params['end_date'] = filters.end_date
        if filters.sales_rep_id:
            where_clause += " AND UPPER(RTRIM(LTRIM(Comisionista))) = :rep_f"
            params['rep_f'] = filters.sales_rep_id.upper()
        if filters.client_id:
            where_clause += " AND CodigoCliente = :client_id"
            params['client_id'] = filters.client_id

        # Get Total Count
        count_query = f"SELECT COUNT(*) as total FROM Vis_AEL_DiarioFactxComercial {where_clause}"
        total_count = int(pd.read_sql(text(count_query), db.bind, params=params).iloc[0]['total'])

        # Get Paginated Data
        offset = (filters.page - 1) * filters.page_size
        data_query = f"""
            SELECT 
                NumeroFactura, 
                FechaFactura, 
                CodigoCliente,
                RazonSocial as Cliente, 
                Comisionista,
                BaseImponible as TotalBase
            FROM Vis_AEL_DiarioFactxComercial
            {where_clause}
            ORDER BY FechaFactura DESC, NumeroFactura DESC
            OFFSET :offset ROWS FETCH NEXT :page_size ROWS ONLY
        """
        params['offset'] = offset
        params['page_size'] = filters.page_size
        
        df_inv = pd.read_sql(text(data_query), db.bind, params=params)
        invoices = []
        if not df_inv.empty:
             df_inv['FechaFactura'] = pd.to_datetime(df_inv['FechaFactura']).dt.strftime('%Y-%m-%d')
             invoices = df_inv.to_dict(orient='records')

        return {
            "data": invoices,
            "total": total_count,
            "page": filters.page,
            "page_size": filters.page_size,
            "total_pages": (total_count + filters.page_size - 1) // filters.page_size
        }

    except Exception as e:
        print(f"Error in paginated invoices: {e}")
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
            'Conectrónica': ['JOSE CESPEDES BLANCO', 'ANTONIO MACHO MACHO', 'JESUS COLLADO ARAQUE', 'ADRIÁN ROMERO JIMENEZ'],
            'Sismecánica': ['JUAN CARLOS BENITO RAMOS', 'JAVIER ALLEN PERKINS'],
            'Informática Industrial': ['JUAN CARLOS VALDES ANTON']
        }
        all_allowed_reps = [
            'JOSE CESPEDES BLANCO',
            'JUAN CARLOS BENITO RAMOS',
            'JUAN CARLOS VALDES ANTON',
            'ANTONIO MACHO MACHO',
            'JAVIER ALLEN PERKINS',
            'JESUS COLLADO ARAQUE',
            'ADRIÁN ROMERO JIMENEZ'
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

@router.post("/by-geography")
def get_sales_by_geography(filters: GeographyFilters, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    try:
        # RBAC and Rep Filtering - Simplified Re-implementation
        divisions = {
            'Conectrónica': ['JOSE CESPEDES BLANCO', 'ANTONIO MACHO MACHO', 'JESUS COLLADO ARAQUE', 'ADRIÁN ROMERO JIMENEZ'],
            'Sismecánica': ['JUAN CARLOS BENITO RAMOS', 'JAVIER ALLEN PERKINS'],
            'Informática Industrial': ['JUAN CARLOS VALDES ANTON']
        }
        all_reps = [r for reps in divisions.values() for r in reps]
        
        current_allowed_reps = all_reps
        if filters.division:
            current_allowed_reps = divisions.get(filters.division, [])

        has_manage_permission = (current_user.role == "admin") or (
            current_user.role_obj and current_user.role_obj.name == "admin"
        ) or (
            current_user.role_obj and current_user.role_obj.can_manage_users
        )
        if not has_manage_permission and current_user.sales_rep_id:
            current_allowed_reps = [rep for rep in current_allowed_reps if rep == current_user.sales_rep_id.upper()]

        common_where = ""
        common_params = {}
        company_filter = "v.CodigoEmpresa = '2'" # Focus on 2025+ mostly for this new feature

        if current_allowed_reps:
            placeholders = [f":rep_{i}" for i in range(len(current_allowed_reps))]
            common_where += f" AND UPPER(RTRIM(LTRIM(v.Comisionista))) IN ({', '.join(placeholders)})"
            for i, rep in enumerate(current_allowed_reps):
                common_params[f'rep_{i}'] = rep
        else:
            common_where += " AND 1=0"

        if filters.start_date:
            common_where += " AND TRY_CONVERT(date, v.FechaFactura) >= :start_date"
            common_params['start_date'] = filters.start_date
        if filters.end_date:
            common_where += " AND TRY_CONVERT(date, v.FechaFactura) <= :end_date"
            common_params['end_date'] = filters.end_date
        if filters.sales_rep_id:
            common_where += " AND UPPER(RTRIM(LTRIM(v.Comisionista))) = :sales_rep_id_f"
            common_params['sales_rep_id_f'] = filters.sales_rep_id.upper()
        if filters.client_id:
            common_where += " AND v.CodigoCliente = :client_id"
            common_params['client_id'] = filters.client_id

        # Regional Aggregation
        if filters.scope == "nacional":
            geo_field = "c.Provincia"
            geo_cond = "(c.SiglaNacion = 'E' OR c.SiglaNacion IS NULL OR c.SiglaNacion = '')"
        else:
            geo_field = "c.SiglaNacion"
            geo_cond = "(c.SiglaNacion != 'E' AND c.SiglaNacion IS NOT NULL AND c.SiglaNacion != '')"

        query = f"""
            SELECT 
                {geo_field} as region,
                SUM(v.BaseImponible) as revenue,
                COUNT(DISTINCT v.CodigoCliente) as clients,
                COUNT(v.NumeroFactura) as invoices
            FROM Vis_AEL_DiarioFactxComercial v
            JOIN Clientes c ON v.CodigoCliente = c.CodigoCliente AND v.CodigoEmpresa = c.CodigoEmpresa
            WHERE {company_filter} AND {geo_cond} {common_where}
            GROUP BY {geo_field}
            ORDER BY revenue DESC
        """
        
        df = pd.read_sql(text(query), db.bind, params=common_params)
        return {"regions": df.to_dict(orient='records')}

    except Exception as e:
        print(f"Error in get_sales_by_geography: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/region-detail")
def get_region_detail(filters: RegionDetailFilters, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    try:
        # Re-use RBAC but simplified
        divisions = {
            'Conectrónica': ['JOSE CESPEDES BLANCO', 'ANTONIO MACHO MACHO', 'JESUS COLLADO ARAQUE', 'ADRIÁN ROMERO JIMENEZ'],
            'Sismecánica': ['JUAN CARLOS BENITO RAMOS', 'JAVIER ALLEN PERKINS'],
            'Informática Industrial': ['JUAN CARLOS VALDES ANTON']
        }
        all_reps = [r for reps in divisions.values() for r in reps]
        
        current_allowed_reps = all_reps
        if filters.division:
            current_allowed_reps = divisions.get(filters.division, [])

        has_manage_permission = (current_user.role == "admin") or (
            current_user.role_obj and current_user.role_obj.name == "admin"
        ) or (
            current_user.role_obj and current_user.role_obj.can_manage_users
        )
        if not has_manage_permission and current_user.sales_rep_id:
            current_allowed_reps = [rep for rep in current_allowed_reps if rep == current_user.sales_rep_id.upper()]

        common_where = ""
        common_params = {}
        company_filter = "v.CodigoEmpresa = '2'"

        if current_allowed_reps:
            placeholders = [f":rep_{i}" for i in range(len(current_allowed_reps))]
            common_where += f" AND UPPER(RTRIM(LTRIM(v.Comisionista))) IN ({', '.join(placeholders)})"
            for i, rep in enumerate(current_allowed_reps):
                common_params[f'rep_{i}'] = rep
        else:
            common_where += " AND 1=0"

        if filters.start_date:
            common_where += " AND TRY_CONVERT(date, v.FechaFactura) >= :start_date"
            common_params['start_date'] = filters.start_date
        if filters.end_date:
            common_where += " AND TRY_CONVERT(date, v.FechaFactura) <= :end_date"
            common_params['end_date'] = filters.end_date
        if filters.sales_rep_id:
            common_where += " AND UPPER(RTRIM(LTRIM(v.Comisionista))) = :sales_rep_id_f"
            common_params['sales_rep_id_f'] = filters.sales_rep_id.upper()
        if filters.client_id:
            common_where += " AND v.CodigoCliente = :client_id"
            common_params['client_id'] = filters.client_id

        if filters.scope == "nacional":
            geo_cond = "c.Provincia = :region"
        else:
            geo_cond = "c.SiglaNacion = :region"
        
        common_params['region'] = filters.region

        query = f"""
            SELECT 
                c.RazonSocial as name,
                c.CodigoCliente as code,
                SUM(v.BaseImponible) as revenue,
                COUNT(v.NumeroFactura) as invoices,
                v.Comisionista as rep,
                MAX(v.FechaFactura) as last_date
            FROM Vis_AEL_DiarioFactxComercial v
            JOIN Clientes c ON v.CodigoCliente = c.CodigoCliente AND v.CodigoEmpresa = c.CodigoEmpresa
            WHERE {company_filter} AND {geo_cond} {common_where}
            GROUP BY c.RazonSocial, c.CodigoCliente, v.Comisionista
            ORDER BY revenue DESC
        """
        
        df = pd.read_sql(text(query), db.bind, params=common_params)
        if not df.empty:
            df['last_date'] = df['last_date'].apply(lambda x: x.isoformat() if x else None)

        return {
            "region": filters.region,
            "clients": df.to_dict(orient='records')
        }

    except Exception as e:
        print(f"Error in get_region_detail: {e}")
        raise HTTPException(status_code=500, detail=str(e))
