from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn)
        return df

print("--- Tables ---")
tables = q("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE (TABLE_NAME LIKE '%Operario%' OR TABLE_NAME LIKE '%Incidenc%' OR TABLE_NAME LIKE '%Parte%') AND TABLE_TYPE = 'BASE TABLE'")
print(tables.to_string())

# Check if there are incidencias for work 496 (which is working) vs others
print("\n--- Incidencias for 496 ---")
print(q("SELECT COUNT(*) as cnt FROM Incidencias WHERE NumeroTrabajo = 496 AND EjercicioTrabajo = 2026"))

print("\n--- Incidencias for 575 (finished but empty in list) ---")
print(q("SELECT COUNT(*) as cnt FROM Incidencias WHERE NumeroTrabajo = 575 AND EjercicioTrabajo = 2026"))
