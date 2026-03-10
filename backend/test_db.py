from database import SessionLocal
from sqlalchemy import text
import pandas as pd

db = SessionLocal()

print("\n--- TEST ALMACENES ---")
try:
    q = "SELECT TOP 5 CodigoAlmacen, Almacen FROM Almacenes WHERE CodigoEmpresa = 2"
    df = pd.read_sql(text(q), db.bind)
    print(df.to_string())
except Exception as e:
    print(f"Error: {e}")
