from database import SessionLocal
import pandas as pd
from sqlalchemy import text

db = SessionLocal()

query = """
SELECT TOP 5
    c.Comisionista,
    p.BaseImponiblePendiente,
    p.UnidadesPendientes,
    p.PrecioCoste,
    p.CodigoEmpresa
FROM CEN_PowerBi_LineasPedVen_Vendedor p
LEFT JOIN Comisionistas c ON p.CodigoComisionista = c.CodigoComisionista AND p.CodigoEmpresa = c.CodigoEmpresa
WHERE p.UnidadesPendientes > 0
"""

print("Testing Pending Orders Query...")
try:
    df = pd.read_sql(text(query), db.bind)
    print("Success!")
    print(df)
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
