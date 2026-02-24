from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)

print("--- Mapping of Workshops (CentrosTrabajo) to Operarios ---")
query = """
SELECT cto.CodigoEmpresa, cto.CentroTrabajo, ct.DescripcionCentro, cto.Operario, trs.NombreOperario
FROM CentrosTrabajoOperarios cto
JOIN CentrosTrabajo ct ON cto.CodigoEmpresa = ct.CodigoEmpresa AND cto.CentroTrabajo = ct.CentroTrabajo
LEFT JOIN Operarios trs ON cto.CodigoEmpresa = trs.CodigoEmpresa AND cto.Operario = trs.Operario
"""
print(q(query).to_string(index=False))
