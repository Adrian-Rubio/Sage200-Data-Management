import json
from database import engine
from sqlalchemy import text

res = {}
with engine.connect() as conn:
    tables_query = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%FacturaProveedor%' OR TABLE_NAME LIKE '%AlbaranCompra%' OR TABLE_NAME LIKE '%PedidoProveedor%'"
    result = conn.execute(text(tables_query))
    tables = [r[0] for r in result]
    res['tables'] = tables
    
    good_tables = {}
    for t in tables:
        if 'Lineas' in t:
            col_query = f"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{t}'"
            cols_result = conn.execute(text(col_query))
            cols = [r[0] for r in cols_result]
            if any('Precio' in c for c in cols) and any('Articulo' in c for c in cols):
                good_tables[t] = cols

    res['good_tables'] = good_tables

with open('price_history_tables.json', 'w') as f:
    json.dump(res, f, indent=2)
