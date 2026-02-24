from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)

print("--- Any records in IncidenciasOperariosDesglose for 2026? ---")
print(q("SELECT TOP 10 * FROM IncidenciasOperariosDesglose WHERE EjercicioTrabajo = 2026"))
