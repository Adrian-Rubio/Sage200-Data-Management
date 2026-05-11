from sqlalchemy import text
from database import engine

with engine.connect() as conn:
    res = conn.execute(text("SELECT name FROM sys.views WHERE name LIKE '%Factura%'"))
    for r in res:
        print(r[0])
