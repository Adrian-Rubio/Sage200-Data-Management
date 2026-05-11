from sqlalchemy import text
from database import engine

queries = [
    "SELECT name FROM sys.tables WHERE name LIKE '%CabeceraFactura%'",
    "SELECT name FROM sys.tables WHERE name LIKE '%FacturaProveedor%'",
    "SELECT name FROM sys.tables WHERE name LIKE '%FacturaCompra%'"
]

with engine.connect() as conn:
    for q in queries:
        print(f"Results for: {q}")
        res = conn.execute(text(q))
        for r in res:
            print(f"  {r[0]}")
        print("-" * 20)
