from sqlalchemy import text
from database import engine

with engine.connect() as conn:
    res = conn.execute(text("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%Factura%'"))
    for r in res:
        print(r[0])
