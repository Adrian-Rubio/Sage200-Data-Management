from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn)
        return df

print("--- 496 Incidencias Orden Check ---")
print(q("SELECT Orden, Operario, DescripcionOperacion FROM Incidencias WHERE NumeroTrabajo = 496 AND EjercicioTrabajo = 2026"))

print("\n--- 490 Incidencias Orden Check ---")
print(q("SELECT Orden, Operario, DescripcionOperacion FROM Incidencias WHERE NumeroTrabajo = 490 AND EjercicioTrabajo = 2026"))
