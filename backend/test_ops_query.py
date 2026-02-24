import requests
import json

# Try to get token if possible, or just hit the endpoint if auth is disabled for local
# Actually, I'll just check the DB with the exact same query as the router
from database import engine
from sqlalchemy import text
import pandas as pd

exercise = 2026
work_num = 496

query = """
    SELECT 
        op.Orden, op.CodigoArticulo, op.DescripcionOperacion, 
        op.OperacionExterna, op.EstadoOperacion, 
        op.TiempoUnFabricacion, op.TiempoTotal,
        (
            SELECT STRING_AGG(NombreOperario, ', ')
            FROM (
                SELECT DISTINCT trs2.NombreOperario
                FROM Incidencias inc2
                JOIN Operarios trs2 ON inc2.CodigoEmpresa = trs2.CodigoEmpresa
                                   AND inc2.Operario = trs2.Operario
                WHERE inc2.CodigoEmpresa = op.CodigoEmpresa
                  AND inc2.EjercicioTrabajo = op.EjercicioTrabajo
                  AND inc2.NumeroTrabajo = op.NumeroTrabajo
                  AND inc2.Orden = op.Orden
                  AND inc2.Operario != 0
            ) d
        ) AS Operarios
    FROM OperacionesOT op
    WHERE op.CodigoEmpresa = 2 AND op.EjercicioTrabajo = :exercise AND op.NumeroTrabajo = :work_num
    ORDER BY op.Orden ASC
"""

print(f"Testing query for Exercise={exercise}, WorkNum={work_num}")
try:
    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn, params={"exercise": exercise, "work_num": work_num})
        print(f"Rows: {len(df)}")
        if len(df) > 0:
            print(df.to_string(index=False))
        else:
            print("No rows found.")
except Exception as e:
    print(f"Error: {e}")
