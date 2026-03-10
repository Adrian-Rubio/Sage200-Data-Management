from database import SessionLocal
from sqlalchemy import text
import pandas as pd

db = SessionLocal()

# Mocking the article logic
code = '21100464'
comp = 2

# 1. Latest info for company
latest_q = "SELECT MAX(Ejercicio) as ex, MAX(Periodo) as per FROM PowerBi_AcumuladoStock WHERE CodigoEmpresa = :comp"
latest = pd.read_sql(text(latest_q), db.bind, params={"comp": comp}).iloc[0]
ex, per = int(latest['ex']), int(latest['per'])
print(f"Latest Company Period: {ex}/{per}")

# 2. Stock for article in that period
stock_q = """
    SELECT Almacen as warehouse, UnidadSaldo as stock
    FROM PowerBi_AcumuladoStock
    WHERE CodigoEmpresa = :comp AND CodigoArticulo = :code AND Ejercicio = :ex AND Periodo = :per
"""
df_stock = pd.read_sql(text(stock_q), db.bind, params={"code": code, "comp": comp, "ex": ex, "per": per})
print(f"Stock for {code} in {ex}/{per}:")
print(df_stock)

# 3. Check what other periods this article has
all_periods_q = """
    SELECT TOP 5 Ejercicio, Periodo, UnidadSaldo
    FROM PowerBi_AcumuladoStock
    WHERE CodigoEmpresa = :comp AND CodigoArticulo = :code
    ORDER BY Ejercicio DESC, Periodo DESC
"""
df_all = pd.read_sql(text(all_periods_q), db.bind, params={"code": code, "comp": comp})
print(f"All records for {code}:")
print(df_all)

# 4. Check real-time data from transactional tables if available
# Instead of Existencias, let's try something else common in Sage 200
# Actually, let's just check why sales and purchases are 0.
sales_q = "SELECT COUNT(*) FROM LineasPedidoCliente WHERE CodigoEmpresa = 2 AND CodigoArticulo = '21100464' AND UnidadesPendientes > 0"
print(f"Pending Sales: {db.execute(text(sales_q)).fetchone()[0]}")

purch_q = "SELECT COUNT(*) FROM LineasPedidoProveedor WHERE CodigoEmpresa = 2 AND CodigoArticulo = '21100464' AND UnidadesPendientes > 0"
print(f"Pending Purchases: {db.execute(text(purch_q)).fetchone()[0]}")
