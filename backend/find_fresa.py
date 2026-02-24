from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)

print("--- Searching for ANY Incidencia with Operacion = 'FRESA001' ---")
# This is a common operation. Let's see how it's linked in 2026.
print(q("SELECT TOP 20 CodigoEmpresa, EjercicioTrabajo, NumeroTrabajo, Orden, Operario, Fecha FROM Incidencias WHERE Operacion = 'FRESA001' AND EjercicioTrabajo = 2026 ORDER BY Fecha DESC"))
