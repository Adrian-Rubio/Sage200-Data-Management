from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)

print("--- Incidencias for 496 (The Working One) ---")
print(q("SELECT NumeroTrabajo, Orden, Operario, Incidencia, DescripcionOperacion FROM Incidencias WHERE NumeroTrabajo = 496 AND EjercicioTrabajo = 2026"))

print("\n--- Incidencias for 494 (The Missing One) ---")
print(q("SELECT NumeroTrabajo, Orden, Operario, Incidencia, DescripcionOperacion FROM Incidencias WHERE NumeroTrabajo = 494 AND EjercicioTrabajo = 2026"))
