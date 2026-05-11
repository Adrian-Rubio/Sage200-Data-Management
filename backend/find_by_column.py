from sqlalchemy import text
from database import engine

with engine.connect() as conn:
    query = """
        SELECT DISTINCT TABLE_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE COLUMN_NAME = 'NumeroFactura' 
          AND TABLE_NAME LIKE '%Proveedor%'
    """
    res = conn.execute(text(query))
    for r in res:
        print(r[0])
