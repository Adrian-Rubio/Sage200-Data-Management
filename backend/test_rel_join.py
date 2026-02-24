from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)

print("--- Searching for Incidencias via RelacionOTOF for 492 ---")
query = """
SELECT inc.NumeroTrabajo, inc.Operario, trs.NombreOperario
FROM RelacionOTOF rel
JOIN Incidencias inc ON rel.CodigoEmpresa = inc.CodigoEmpresa 
                    AND rel.EjercicioFabricacion = inc.EjercicioTrabajo 
                    AND rel.NumeroTrabajo = inc.NumeroTrabajo
JOIN Operarios trs ON inc.CodigoEmpresa = trs.CodigoEmpresa AND inc.Operario = trs.Operario
WHERE rel.NumeroTrabajo = 492 AND rel.EjercicioFabricacion = 2026
"""
# This matches my current query.
print(q(query).to_string(index=False))

print("\n--- Try searching without the RELACION link, just BROAD ---")
print(q("SELECT DISTINCT Operario, CodigoEmpresa, EjercicioTrabajo FROM Incidencias WHERE NumeroTrabajo = 492"))
