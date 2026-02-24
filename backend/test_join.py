from database import engine
from sqlalchemy import text
import pandas as pd

query = """
    SELECT 
        op.Orden, op.CodigoArticulo, op.DescripcionOperacion, 
        (
            SELECT STRING_AGG(NombreOperario, ', ')
            FROM (
                SELECT DISTINCT trs.NombreOperario
                FROM Incidencias inc
                JOIN Operarios trs ON inc.Operario = trs.Operario
                WHERE inc.EjercicioTrabajo = op.EjercicioTrabajo
                  AND inc.NumeroTrabajo = op.NumeroTrabajo
                  AND inc.Orden = op.Orden
            ) d
        ) AS Operarios
    FROM OperacionesOT op
    WHERE op.EjercicioTrabajo = 2026 AND op.NumeroTrabajo = 496
    ORDER BY op.Orden ASC
"""
try:
    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn)
        pd.set_option('display.max_rows', None)
        print(df.to_string())
except Exception as e:
    print("Error:", e)
