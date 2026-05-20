from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
import auth, models
from datetime import datetime, timedelta
import pandas as pd

router = APIRouter()

@router.get("/summary")
def get_home_summary(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    from dubes.database_cache import SessionLocal as DubesSession
    from dubes.models import Sale
    
    current_date = datetime.now()
    current_month = current_date.month
    current_year = current_date.year
    
    # --- VENTAS Y PRESUPUESTO (Cenvalsa Co 2) ---
    q_billing = """
        SELECT 
            SUM(CASE WHEN BaseImponible > 0 THEN BaseImponible ELSE 0 END) as Bruto,
            SUM(CASE WHEN BaseImponible < 0 THEN BaseImponible ELSE 0 END) as Abonos,
            SUM(BaseImponible) as Neto
        FROM CEN_PowerBI_LineasAlbaranesFacturadosSinDuplicados WITH (NOLOCK)
        WHERE CodigoEmpresa = 2 
          AND EjercicioFactura = :year 
          AND MONTH(FechaFactura) = :month
    """
    billing_res = db.execute(text(q_billing), {"year": current_year, "month": current_month}).fetchone()
    fact_bruta = float(billing_res[0]) if billing_res and billing_res[0] else 0
    abonos = float(billing_res[1]) if billing_res and billing_res[1] else 0
    fact_neta = float(billing_res[2]) if billing_res and billing_res[2] else 0
    
    q_budget = """
        SELECT SUM(Presupuesto) as Objetivo
        FROM Presupuestos_AEL WITH (NOLOCK)
        WHERE Año = :year AND Mes = :month
    """
    budget_res = db.execute(text(q_budget), {"year": current_year, "month": current_month}).fetchone()
    objetivo = float(budget_res[0]) if budget_res and budget_res[0] else 0
    cumplimiento = (fact_bruta / objetivo * 100) if objetivo > 0 else 0

    # --- MÉTRICAS DE GESTIÓN (Nuevas) ---
    # 1. Número de pedidos de clientes (Mes actual)
    q_orders_count = """
        SELECT COUNT(DISTINCT NumeroPedido) 
        FROM CabeceraPedidoCliente WITH (NOLOCK) 
        WHERE CodigoEmpresa = 2 AND EjercicioPedido = :year AND MONTH(FechaPedido) = :month
    """
    orders_count = db.execute(text(q_orders_count), {"year": current_year, "month": current_month}).scalar() or 0

    # 2. Número de pedidos preparados (Albaranes creados este mes)
    q_prepared_count = """
        SELECT COUNT(DISTINCT NumeroAlbaran) 
        FROM CabeceraAlbaranCliente WITH (NOLOCK) 
        WHERE CodigoEmpresa = 2 AND EjercicioAlbaran = :year AND MONTH(FechaAlbaran) = :month
    """
    prepared_count = db.execute(text(q_prepared_count), {"year": current_year, "month": current_month}).scalar() or 0

    # 3. Número de clientes únicos (Con actividad este mes)
    q_unique_clients = """
        SELECT COUNT(DISTINCT CodigoCliente) 
        FROM CabeceraPedidoCliente WITH (NOLOCK) 
        WHERE CodigoEmpresa = 2 AND EjercicioPedido = :year AND MONTH(FechaPedido) = :month
    """
    unique_clients = db.execute(text(q_unique_clients), {"year": current_year, "month": current_month}).scalar() or 0

    # 4. Número de clientes nuevos (Alta este mes)
    q_new_clients = """
        SELECT COUNT(*) 
        FROM Clientes WITH (NOLOCK) 
        WHERE CodigoEmpresa = 2 AND YEAR(FechaAlta) = :year AND MONTH(FechaAlta) = :month
    """
    new_clients = db.execute(text(q_new_clients), {"year": current_year, "month": current_month}).scalar() or 0

    # --- COMPRAS ---
    q_purchases = """
        SELECT SUM(BaseImponible) as Total
        FROM PowerBi_ComprasDetalle WITH (NOLOCK)
        WHERE CodigoEmpresa = 2 AND Ejercicio = :year AND MONTH(Fecha) = :month
    """
    purch_res = db.execute(text(q_purchases), {"year": current_year, "month": current_month}).fetchone()
    total_compras = float(purch_res[0]) if purch_res and purch_res[0] else 0

    # --- Otros KPIs ---
    q_fact_saratur = "SELECT SUM(BaseImponible) FROM CEN_PowerBI_LineasAlbaranesFacturadosSinDuplicados WITH (NOLOCK) WHERE CodigoEmpresa = 6 AND EjercicioFactura = :year AND MONTH(FechaFactura) = :month"
    ventas_saratur = db.execute(text(q_fact_saratur), {"year": current_year, "month": current_month}).scalar() or 0
    
    ventas_restauracion = 0
    try:
        dubes_db = DubesSession()
        start_of_month = datetime(current_year, current_month, 1)
        res_rest = dubes_db.query(text("SUM(Total)")).select_from(Sale).filter(Sale.CheckOutDate >= start_of_month, Sale.IsDeleted == False).scalar()
        ventas_restauracion = float(res_rest) if res_rest else 0
        dubes_db.close()
    except Exception as e: print(f"Error Dubes: {e}")
    
    q_cartera = "SELECT SUM(ImporteNetoPendiente) FROM LineasPedidoCliente WITH (NOLOCK) WHERE CodigoEmpresa IN (2, 6) AND UnidadesPendientes > 0"
    cartera_total = db.execute(text(q_cartera)).scalar() or 0

    # --- Alertas ---
    alerts = []
    pwd_count = db.query(models.User).filter(models.User.must_change_password == True).count()
    if pwd_count > 0:
        alerts.append({"id": "pwd_change", "type": "warning", "title": "SEGURIDAD", "message": f"{pwd_count} usuarios pendientes de clave."})
    alerts.append({"id": "etl_sync", "type": "success", "title": "SISTEMA", "message": "Sincronización OK."})

    # --- DIVISIONS DEFINITION ---
    divisions = {
        'Conectrónica': ['JOSE CESPEDES BLANCO', 'ANTONIO MACHO MACHO', 'JESUS COLLADO ARAQUE', 'ADRIÁN ROMERO JIMENEZ'],
        'Sismecánica': ['JUAN CARLOS BENITO RAMOS', 'JAVIER ALLEN PERKINS'],
        'Informática Industrial': ['JUAN CARLOS VALDES ANTON']
    }
    rep_to_div = {rep.upper(): div for div, reps in divisions.items() for rep in reps}

    # --- MARGEN DEL MES ACTUAL ---
    margin_global = 0.0
    margins_by_div = {
        'Conectrónica': 0.0,
        'Sismecánica': 0.0,
        'Informática Industrial': 0.0
    }
    
    try:
        q_margin_data = """
            SELECT Comisionista, BaseImponible, ImporteCoste
            FROM VIS_CEN_LinAlbFacSD WITH (NOLOCK)
            WHERE CodigoEmpresa = 2 
              AND EjercicioFactura = :year 
              AND MONTH(FechaFactura) = :month
        """
        df_m = pd.read_sql(text(q_margin_data), db.bind, params={"year": current_year, "month": current_month})
        
        if not df_m.empty:
            df_m.columns = [c.strip() for c in df_m.columns]
            df_m['BaseImponible'] = pd.to_numeric(df_m['BaseImponible'], errors='coerce').fillna(0)
            df_m['ImporteCoste'] = pd.to_numeric(df_m['ImporteCoste'], errors='coerce').fillna(0)
            
            sum_base = df_m['BaseImponible'].sum()
            sum_cost = df_m['ImporteCoste'].sum()
            if sum_base > 0:
                margin_global = round(float((sum_base - sum_cost) / sum_base * 100), 2)
                
            df_m['Comisionista'] = df_m['Comisionista'].str.strip().str.upper()
            df_m['Division'] = df_m['Comisionista'].map(rep_to_div).fillna('Otros')
            
            for div in margins_by_div.keys():
                df_div = df_m[df_m['Division'] == div]
                if not df_div.empty:
                    div_base = df_div['BaseImponible'].sum()
                    div_cost = df_div['ImporteCoste'].sum()
                    if div_base > 0:
                        margins_by_div[div] = round(float((div_base - div_cost) / div_base * 100), 2)
    except Exception as e:
        print(f"Error calculating margin for home summary: {e}")

    # --- VENTA CRUZADA (COMPARATIVA YTD ACTUAL vs ANTERIOR) ---
    cross_selling = []
    try:
        prev_year = current_year - 1
        try:
            prev_date_limit = current_date.replace(year=prev_year)
        except ValueError:
            prev_date_limit = current_date.replace(year=prev_year, day=28)

        q_cross = """
            SELECT CodigoCliente, RazonSocial, Comisionista, FechaFactura
            FROM Vis_AEL_DiarioFactxComercial WITH (NOLOCK)
            WHERE CodigoEmpresa = '2'
              AND (
                (FechaFactura >= :current_ytd_start AND FechaFactura <= :current_date)
                OR
                (FechaFactura >= :prev_ytd_start AND FechaFactura <= :prev_date_limit)
              )
        """
        
        params = {
            "current_ytd_start": f"{current_year}-01-01",
            "current_date": current_date,
            "prev_ytd_start": f"{prev_year}-01-01",
            "prev_date_limit": prev_date_limit
        }
        
        df_cross = pd.read_sql(text(q_cross), db.bind, params=params)
        if not df_cross.empty:
            df_cross['Comisionista'] = df_cross['Comisionista'].str.strip().str.upper()
            df_cross['Division'] = df_cross['Comisionista'].map(rep_to_div).fillna('Otros')
            df_cross = df_cross[df_cross['Division'] != 'Otros']
            
            df_cross['FechaFactura'] = pd.to_datetime(df_cross['FechaFactura'])
            
            df_curr = df_cross[df_cross['FechaFactura'].dt.year == current_year]
            df_prev = df_cross[df_cross['FechaFactura'].dt.year == prev_year]
            
            def get_cross_sell_data(df_period):
                if df_period.empty:
                    return set(), {}, 0
                client_divs = df_period.groupby(['CodigoCliente', 'RazonSocial'])['Division'].unique().reset_index()
                client_divs['NumDivisions'] = client_divs['Division'].apply(len)
                total_clients = len(client_divs)
                cross_sell_clients = client_divs[client_divs['NumDivisions'] > 1]
                
                combinations_map = {}
                if not cross_sell_clients.empty:
                    cross_sell_clients = cross_sell_clients.copy()
                    cross_sell_clients['CombKey'] = cross_sell_clients['Division'].apply(lambda x: " + ".join(sorted(x)))
                    for comb, group in cross_sell_clients.groupby('CombKey'):
                        combinations_map[comb] = {
                            "count": len(group),
                            "clients": {row['CodigoCliente'].strip(): row['RazonSocial'].strip() for _, row in group.iterrows()}
                        }
                return set(combinations_map.keys()), combinations_map, total_clients

            curr_combs, curr_map, curr_total = get_cross_sell_data(df_curr)
            prev_combs, prev_map, prev_total = get_cross_sell_data(df_prev)
            
            all_combinations = curr_combs.union(prev_combs)
            
            for comb in all_combinations:
                curr_data = curr_map.get(comb, {"count": 0, "clients": {}})
                prev_data = prev_map.get(comb, {"count": 0, "clients": {}})
                
                curr_count = curr_data["count"]
                prev_count = prev_data["count"]
                
                curr_pct = round(curr_count / curr_total * 100, 2) if curr_total > 0 else 0
                prev_pct = round(prev_count / prev_total * 100, 2) if prev_total > 0 else 0
                
                curr_clients = curr_data["clients"]
                prev_clients = prev_data["clients"]
                
                curr_ids = set(curr_clients.keys())
                prev_ids = set(prev_clients.keys())
                
                maintained_ids = curr_ids.intersection(prev_ids)
                new_ids = curr_ids.difference(prev_ids)
                no_longer_ids = prev_ids.difference(curr_ids)
                
                def format_clients(id_set, src1, src2):
                    res = []
                    for cid in id_set:
                        name = src1.get(cid) or src2.get(cid) or ""
                        res.append({"id": cid, "name": name})
                    return sorted(res, key=lambda x: x["name"])
                
                cross_selling.append({
                    "combination": comb,
                    "current_count": curr_count,
                    "current_percentage": curr_pct,
                    "prev_count": prev_count,
                    "prev_percentage": prev_pct,
                    "clients_maintained": format_clients(maintained_ids, curr_clients, prev_clients),
                    "clients_new": format_clients(new_ids, curr_clients, prev_clients),
                    "clients_no_longer": format_clients(no_longer_ids, curr_clients, prev_clients)
                })
            
            # Sort by current count desc
            cross_selling.sort(key=lambda x: x['current_count'], reverse=True)
    except Exception as e:
        print(f"Error calculating cross selling for home: {e}")

    meses = {1: "ENERO", 2: "FEBRERO", 3: "MARZO", 4: "ABRIL", 5: "MAYO", 6: "JUNIO", 7: "JULIO", 8: "AGOSTO", 9: "SEPTIEMBRE", 10: "OCTUBRE", 11: "NOVIEMBRE", 12: "DICIEMBRE"}
    
    return {
        "kpis": {
            "ventas_cenval": fact_neta,
            "ventas_restauracion": ventas_restauracion,
            "ventas_saratur": ventas_saratur,
            "cartera": cartera_total,
            "compras": total_compras,
            "stats": {
                "pedidos": orders_count,
                "preparados": prepared_count,
                "clientes_unicos": unique_clients,
                "clientes_nuevos": new_clients
            },
            "budget": {
                "bruto": fact_bruta, "abonos": abonos, "neto": fact_neta,
                "objetivo": objetivo, "cumplimiento": cumplimiento
            },
            "margin": {
                "global": margin_global,
                "by_division": margins_by_div
            }
        },
        "alerts": alerts,
        "cross_selling": cross_selling,
        "month_name": meses[current_month]
    }

