from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)

print("--- Searching for ANY SIS/INF series order with Operarios recorded ---")
query = """
SELECT TOP 20 ot.NumeroTrabajo, ot.EjercicioTrabajo, ot.SerieFabricacion, inc.Operario, trs.NombreOperario
FROM OrdenesTrabajo ot
JOIN Incidencias inc ON ot.EjercicioTrabajo = inc.EjercicioTrabajo AND ot.NumeroTrabajo = inc.NumeroTrabajo
JOIN Operarios trs ON inc.CodigoEmpresa = trs.CodigoEmpresa AND inc.Operario = trs.Operario
WHERE ot.SerieFabricacion IN ('SIS', 'INF') AND inc.Operario != 0 AND inc.EjercicioTrabajo = 2026
"""
print(q(query).to_string(index=False))
