from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn)
        return df

print("--- Incidencias for 575 ---")
df = q("SELECT EjercicioTrabajo, NumeroTrabajo, Fecha, Operario FROM Incidencias WHERE NumeroTrabajo = 575 ORDER BY Fecha DESC")
print(df.to_string())
