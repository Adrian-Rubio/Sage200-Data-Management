from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)

print("--- pwb_OperarioOperacion Columns ---")
print(q("SELECT TOP 0 * FROM pwb_OperarioOperacion").columns.tolist())

print("\n--- pwb_OperarioOperacion data for 494/492 ---")
# assuming it might have NumTrabajo or Ejercicio
try:
    print(q("SELECT * FROM pwb_OperarioOperacion WHERE NumeroTrabajo IN (494, 492) AND EjercicioTrabajo = 2026"))
except:
    print("Column mismatch, peeking instead:")
    print(q("SELECT TOP 5 * FROM pwb_OperarioOperacion"))
