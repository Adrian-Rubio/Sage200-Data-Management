from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)

print("--- Testing NEW Operario Logic for 494 ---")
query = """
SELECT ot.NumeroTrabajo, ot.NumeroFabricacion,
    (
        SELECT STRING_AGG(NombreOperario, ', ')
        FROM (
            SELECT DISTINCT trs.NombreOperario
            FROM Incidencias inc
            JOIN (
                SELECT DISTINCT Operario, NombreOperario 
                FROM Operarios 
            ) trs ON inc.Operario = trs.Operario
            WHERE (
                    (inc.NumeroTrabajo = ot.NumeroTrabajo AND inc.EjercicioTrabajo = ot.EjercicioTrabajo)
                    OR
                    (inc.NumeroTrabajo = ot.NumeroFabricacion AND inc.EjercicioTrabajo = ot.EjercicioTrabajo)
                )
              AND inc.Operario != 0
        ) d
    ) AS NamesFound
FROM OrdenesTrabajo ot
WHERE ot.NumeroTrabajo = 494 AND ot.EjercicioTrabajo = 2026 AND ot.CodigoEmpresa = 2
"""
print(q(query).to_string(index=False))
