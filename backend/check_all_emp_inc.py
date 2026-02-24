from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)

print("--- Checking 494/492/496 in ANY Empresa in 2026 ---")
query = """
SELECT CodigoEmpresa, NumeroTrabajo, Orden, Operario 
FROM Incidencias 
WHERE NumeroTrabajo IN (494, 492, 496) AND EjercicioTrabajo = 2026
"""
print(q(query).to_string(index=False))
