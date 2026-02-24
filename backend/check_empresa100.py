from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)

print("--- Searching for non-zero operarios for 494/492 in Empresa 100 (2026) ---")
print(q("SELECT CodigoEmpresa, NumeroTrabajo, Orden, Operario FROM Incidencias WHERE NumeroTrabajo IN (494, 492) AND EjercicioTrabajo = 2026 AND CodigoEmpresa = 100 AND Operario != 0"))
