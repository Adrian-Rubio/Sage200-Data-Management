from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn)
        return df

print("--- 496 Identificador Check ---")
print(q("SELECT TOP 5 Identificador, NumeroTrabajo, Orden FROM Incidencias WHERE NumeroTrabajo = 496 AND EjercicioTrabajo = 2026"))

print("\n--- 496 OperacionesOT Identificador Check ---")
# Check if OperacionesOT has Identificador or similar
print(q("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'OperacionesOT' AND (COLUMN_NAME LIKE '%Id%' OR COLUMN_NAME LIKE '%Guid%')"))
