from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)

print("--- Searching for ANY record with NumeroTrabajo = 4886 (Fab of 492) ---")
print(q("SELECT CodigoEmpresa, EjercicioTrabajo, NumeroTrabajo, Operario FROM Incidencias WHERE NumeroTrabajo = 4886"))

print("\n--- Searching for ANY record with NumeroFabricacion = 4886 AND SerieFabricacion = 'SIS' ---")
# Try searching for columns I might have missed
print(q("SELECT TOP 5 * FROM Incidencias WHERE NumeroTrabajo = 4886"))
