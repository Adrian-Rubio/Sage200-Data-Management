from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)

print("--- Searching for 494/492 in Empresa 1 ---")
print(q("SELECT * FROM Incidencias WHERE NumeroTrabajo IN (494, 492) AND CodigoEmpresa = 1"))
