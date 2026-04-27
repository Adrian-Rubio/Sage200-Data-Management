import pandas as pd
from sqlalchemy import create_engine, text
import os, sys
from dotenv import load_dotenv

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(base_dir, 'backend', '.env')
load_dotenv(env_path)

SERVER = os.getenv("DB_SERVER", "localhost")
DATABASE = os.getenv("DB_DATABASE", "Sage") # Connect to Sage
USER = os.getenv("DB_USER")
PASSWORD = os.getenv("DB_PASSWORD")
DRIVER = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")

conn_str = f"mssql+pyodbc://{USER}:{PASSWORD}@{SERVER}/{DATABASE}?driver={DRIVER}&TrustServerCertificate=yes&ApplicationIntent=ReadOnly"
engine = create_engine(conn_str)

query = """
SELECT TOP 10
    op.EjercicioTrabajo, op.NumeroTrabajo, op.Orden, op.Operacion, op.EstadoOperacion,
    (
        SELECT TOP 1 l.estadoLinea 
        FROM SileaCenval.dbo.OrdenFabOperacionLineaTipo t 
        JOIN SileaCenval.dbo.OrdenFabOperacionLinea l ON l.idOperacion = t.orden_fab_operacion_id
        WHERE t.CodigoEmpresa = op.CodigoEmpresa
          AND t.EjercicioTrabajo = op.EjercicioTrabajo
          AND t.NumeroTrabajo = op.NumeroTrabajo
          AND t.Orden = op.Orden
        ORDER BY l.id DESC
    ) as SileaEstado,
    (
        SELECT STRING_AGG(o.operario_id, ', ')
        FROM SileaCenval.dbo.OrdenFabOperacionLineaTipo t 
        JOIN SileaCenval.dbo.OrdenFabOperacionLinea l ON l.idOperacion = t.orden_fab_operacion_id
        JOIN SileaCenval.dbo.operario_orden_fab_linea o ON o.linea_id = l.id
        WHERE t.CodigoEmpresa = op.CodigoEmpresa
          AND t.EjercicioTrabajo = op.EjercicioTrabajo
          AND t.NumeroTrabajo = op.NumeroTrabajo
          AND t.Orden = op.Orden
          AND l.estadoLinea IN ('ACTIVO', 'PAUSADO')
    ) as SileaOperarios_EnCurso
FROM OperacionesOT op
WHERE op.CodigoEmpresa = 2 
  AND op.EjercicioTrabajo = 2025
  AND EXISTS (
      SELECT 1 FROM SileaCenval.dbo.OrdenFabOperacionLineaTipo t2
      WHERE t2.CodigoEmpresa = op.CodigoEmpresa
        AND t2.EjercicioTrabajo = op.EjercicioTrabajo
        AND t2.NumeroTrabajo = op.NumeroTrabajo
        AND t2.Orden = op.Orden
  )
"""

with engine.connect() as conn:
    df = pd.read_sql(text(query), conn)
    print(df.to_string())
