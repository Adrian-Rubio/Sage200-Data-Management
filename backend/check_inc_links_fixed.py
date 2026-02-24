from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)

print("--- Link between WO and Incidencias for 494 ---")
print(q("SELECT NumeroTrabajo, Orden, Operario, DocumentoEnlazado, Identificador FROM Incidencias WHERE NumeroTrabajo = 494").to_string(index=False))

print("\n--- Check for any user field in Incidencias ---")
cols = q("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Incidencias' AND (COLUMN_NAME LIKE '%Usuar%' OR COLUMN_NAME LIKE '%Insert%' OR COLUMN_NAME LIKE '%Empleado%')")
print(cols)
