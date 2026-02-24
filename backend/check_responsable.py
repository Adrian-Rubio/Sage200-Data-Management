from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)

print("--- Checking 'Responsable' and other fields in OrdenesTrabajo for 494/492 ---")
print(q("SELECT NumeroTrabajo, EjercicioTrabajo, SerieFabricacion, CodigoArticulo, Responsable FROM OrdenesTrabajo WHERE NumeroTrabajo IN (494, 492) AND EjercicioTrabajo = 2026"))
