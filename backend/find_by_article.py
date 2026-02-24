from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)

print("--- Searching for any clock-ins for 494's article in 2026 ---")
query = """
SELECT inc.NumeroTrabajo, inc.Orden, inc.Operario, trs.NombreOperario
FROM Incidencias inc
JOIN Operarios trs ON inc.CodigoEmpresa = trs.CodigoEmpresa AND inc.Operario = trs.Operario
JOIN OperacionesOT op ON inc.EjercicioTrabajo = op.EjercicioTrabajo AND inc.NumeroTrabajo = op.NumeroTrabajo AND inc.Orden = op.Orden
WHERE op.CodigoArticulo = 'OM00963-007/000' AND inc.EjercicioTrabajo = 2026
"""
print(q(query).to_string(index=False))
