from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)

print("--- Checking Planified Operarios in Vis_GprOperacionesOT_Planif ---")
try:
    # Check for 494
    print(q("SELECT * FROM Vis_GprOperacionesOT_Planif WHERE NumeroTrabajo = 494 AND EjercicioTrabajo = 2026"))
except Exception as e:
    print(f"Error: {e}")
    # peak columns instead
    print(q("SELECT TOP 0 * FROM Vis_GprOperacionesOT_Planif").columns.tolist())
