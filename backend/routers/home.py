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
            }
        },
        "alerts": alerts,
        "month_name": meses[current_month]
    }
