from sqlalchemy import text
from database import SessionLocal
import datetime

db = SessionLocal()
current_month = datetime.datetime.now().month
current_year = datetime.datetime.now().year

queries = {
    "billing": ("""
        SELECT 
            SUM(CASE WHEN BaseImponible > 0 THEN BaseImponible ELSE 0 END) as Bruto,
            SUM(CASE WHEN BaseImponible < 0 THEN BaseImponible ELSE 0 END) as Abonos,
            SUM(BaseImponible) as Neto
        FROM CEN_PowerBI_LineasAlbaranesFacturadosSinDuplicados WITH (NOLOCK)
        WHERE CodigoEmpresa = 2 
          AND EjercicioFactura = :year 
          AND MONTH(FechaFactura) = :month
    """, {"year": current_year, "month": current_month}),
    "budget": ("""
        SELECT SUM(Presupuesto) as Objetivo
        FROM Presupuestos_AEL WITH (NOLOCK)
        WHERE Año = :year AND Mes = :month
    """, {"year": current_year, "month": current_month}),
    "orders": ("""
        SELECT COUNT(DISTINCT NumeroPedido) 
        FROM CabeceraPedidoCliente WITH (NOLOCK) 
        WHERE CodigoEmpresa = 2 AND EjercicioPedido = :year AND MONTH(FechaPedido) = :month
    """, {"year": current_year, "month": current_month}),
    "prepared": ("""
        SELECT COUNT(DISTINCT NumeroAlbaran) 
        FROM CabeceraAlbaranCliente WITH (NOLOCK) 
        WHERE CodigoEmpresa = 2 AND EjercicioAlbaran = :year AND MONTH(FechaAlbaran) = :month
    """, {"year": current_year, "month": current_month}),
    "unique_clients": ("""
        SELECT COUNT(DISTINCT CodigoCliente) 
        FROM CabeceraPedidoCliente WITH (NOLOCK) 
        WHERE CodigoEmpresa = 2 AND EjercicioPedido = :year AND MONTH(FechaPedido) = :month
    """, {"year": current_year, "month": current_month}),
    "new_clients": ("""
        SELECT COUNT(*) 
        FROM Clientes WITH (NOLOCK) 
        WHERE CodigoEmpresa = 2 AND YEAR(FechaAlta) = :year AND MONTH(FechaAlta) = :month
    """, {"year": current_year, "month": current_month})
}

for name, (q, p) in queries.items():
    try:
        res = db.execute(text(q), p).fetchone()
        print(f"{name}: {res}")
    except Exception as e:
        print(f"ERROR in {name}: {e}")

db.close()
