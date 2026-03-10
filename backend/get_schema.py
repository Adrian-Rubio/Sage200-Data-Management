
import pandas as pd
from database import engine
from sqlalchemy import text

def get_cols(table_name):
    query = f"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{table_name}'"
    try:
        return pd.read_sql(text(query), engine)['COLUMN_NAME'].tolist()
    except:
        return []

tables = ['Articulos', 'PowerBi_AcumuladoStock', 'LineasPedidoCliente', 'LineasPedidoProveedor', 'CabeceraPedidoCliente', 'CabeceraPedidoProveedor', 'OrdenesTrabajo']
for t in tables:
    cols = get_cols(t)
    keywords = ['UNIDAD', 'PENDIENTE', 'FECHA', 'ARTICULO', 'ESTADO', 'SERVIDO', 'CLIENTE', 'PROVEEDOR', 'STOCK', 'ALMACEN', 'COSTE', 'PRECIO']
    filtered = [c for c in cols if any(k in c.upper() for k in keywords)]
    print(f"--- {t} ---")
    print(filtered)
