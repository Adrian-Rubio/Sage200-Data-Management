import json
from database import engine
from sqlalchemy import text

res = {}
with engine.connect() as conn:
    tables_query = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%FacturaCliente%' OR TABLE_NAME LIKE '%PedidoCliente%'"
    result = conn.execute(text(tables_query))
    tables = [r[0] for r in result]
    res['tables'] = tables

with open('sales_tables_info.json', 'w') as f:
    json.dump(res, f, indent=2)
