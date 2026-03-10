from database import SessionLocal
from sqlalchemy import text
import pandas as pd

db = SessionLocal()

print("=== VENTAS CON JOIN A CABECERA ===")
q = """
    SELECT TOP 5
        l.SeriePedido + '/' + CAST(l.NumeroPedido as varchar) as order_num,
        l.CodigodelCliente as client_code,
        cab.RazonSocial as client_name,
        l.UnidadesPendientes as qty_pending,
        l.FechaEntrega as date_expected
    FROM LineasPedidoCliente l
    LEFT JOIN CabeceraPedidoCliente cab 
        ON l.CodigoEmpresa = cab.CodigoEmpresa 
        AND l.EjercicioPedido = cab.EjercicioPedido 
        AND l.SeriePedido = cab.SeriePedido 
        AND l.NumeroPedido = cab.NumeroPedido
    WHERE l.CodigoEmpresa = 2 
      AND l.CodigoArticulo = '21100464'
      AND l.UnidadesPendientes > 0
"""
df = pd.read_sql(text(q), db.bind)
print(df.to_string())

print("\n=== VER CABECERA PROVEEDORES ===")
cols = list(db.execute(text("SELECT TOP 1 * FROM CabeceraPedidoProveedor WHERE CodigoEmpresa = 2")).keys())
prov_cols = [c for c in cols if any(x in c.lower() for x in ['nombre','razon','proveedor'])]
print("CabeceraPedidoProveedor cols:", prov_cols)

print("\n=== COMPRAS CON JOIN A CABECERA ===")
q2 = """
    SELECT TOP 5
        l.SeriePedido + '/' + CAST(l.NumeroPedido as varchar) as order_num,
        l.CodigodelProveedor as vendor_code,
        cab.RazonSocial as vendor_name,
        l.UnidadesPendientes as qty_pending,
        l.FechaRecepcion as date_expected
    FROM LineasPedidoProveedor l
    LEFT JOIN CabeceraPedidoProveedor cab 
        ON l.CodigoEmpresa = cab.CodigoEmpresa 
        AND l.EjercicioPedido = cab.EjercicioPedido 
        AND l.SeriePedido = cab.SeriePedido 
        AND l.NumeroPedido = cab.NumeroPedido
    WHERE l.CodigoEmpresa = 2 
      AND l.CodigoArticulo = '21100464'
      AND l.UnidadesPendientes > 0
"""
df2 = pd.read_sql(text(q2), db.bind)
print(df2.to_string())
