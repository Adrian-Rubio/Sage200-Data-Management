from database import engine
from sqlalchemy import text
import pandas as pd

query = """
SELECT TOP 20
    ot.NumeroTrabajo,
    (SELECT STRING_AGG(CAST(CodigoEmpresa AS VARCHAR) + ':' + CAST(Operario AS VARCHAR), ', ') 
     FROM Incidencias 
     WHERE EjercicioTrabajo = ot.EjercicioTrabajo AND NumeroTrabajo = ot.NumeroTrabajo AND Operario != 0) as AllIncs,
    (SELECT STRING_AGG(NombreOperario, ', ')
     FROM (
         SELECT DISTINCT trs.NombreOperario
         FROM Incidencias inc
         JOIN Operarios trs ON inc.CodigoEmpresa = trs.CodigoEmpresa AND inc.Operario = trs.Operario
         WHERE inc.EjercicioTrabajo = ot.EjercicioTrabajo AND inc.NumeroTrabajo = ot.NumeroTrabajo AND inc.Operario != 0
         -- REMOVED inc.CodigoEmpresa = ot.CodigoEmpresa TO TEST
     ) d) as OperariosWithoutEmpMatch
FROM OrdenesTrabajo ot
WHERE ot.CodigoEmpresa = 2 AND ot.EjercicioTrabajo = 2026 AND ot.EstadoOT = 2
"""

with engine.connect() as conn:
    df = pd.read_sql(text(query), conn)
    print(df.to_string(index=False))
