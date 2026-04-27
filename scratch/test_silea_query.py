import pandas as pd
from sqlalchemy import create_engine, text
import os, sys
from dotenv import load_dotenv

# Ensure .env is loaded
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(base_dir, 'backend', '.env')
load_dotenv(env_path)

SERVER = os.getenv("DB_SERVER", "localhost")
DATABASE = os.getenv("DB_DATABASE", "Sage")
USER = os.getenv("DB_USER")
PASSWORD = os.getenv("DB_PASSWORD")
DRIVER = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")

conn_str = f"mssql+pyodbc://{USER}:{PASSWORD}@{SERVER}/{DATABASE}?driver={DRIVER}&TrustServerCertificate=yes&ApplicationIntent=ReadOnly"
engine = create_engine(conn_str)

query = """
SELECT TOP 20
    op.EjercicioTrabajo, op.NumeroTrabajo, op.Orden, op.Operacion, 
    op.TiempoTotal as SageTiempoTotal,
    op.EstadoOperacion,
    (
        SELECT TOP 1 l.estadoLinea 
        FROM SileaCenval.dbo.OrdenFabOperacionLinea t_line
        JOIN SileaCenval.dbo.OrdenFabOperacionLineaTipo t ON t.orden_fab_operacion_id = t_line.idOperacion
        JOIN SileaCenval.dbo.OrdenFabOperacionLinea l ON l.id = t_line.id
        WHERE t.CodigoEmpresa = op.CodigoEmpresa
          AND t.EjercicioTrabajo = op.EjercicioTrabajo
          AND t.NumeroTrabajo = op.NumeroTrabajo
          AND t.Orden = op.Orden
        ORDER BY l.fechaInicio DESC
    ) as SileaEstado,
    (
        SELECT ISNULL(CAST(SUM(l.tiempo) AS BIGINT), 0)
        FROM SileaCenval.dbo.OrdenFabOperacionLinea l
        JOIN SileaCenval.dbo.OrdenFabOperacionLineaTipo t ON t.orden_fab_operacion_id = l.idOperacion
        WHERE t.CodigoEmpresa = op.CodigoEmpresa
          AND t.EjercicioTrabajo = op.EjercicioTrabajo
          AND t.NumeroTrabajo = op.NumeroTrabajo
          AND t.Orden = op.Orden
    ) as SileaTiempoTotalMs,
    (
        SELECT STRING_AGG(o.operario_id, ', ')
        FROM SileaCenval.dbo.OrdenFabOperacionLinea l
        JOIN SileaCenval.dbo.OrdenFabOperacionLineaTipo t ON t.orden_fab_operacion_id = l.idOperacion
        JOIN SileaCenval.dbo.operario_orden_fab_linea o ON o.linea_id = l.id
        WHERE t.CodigoEmpresa = op.CodigoEmpresa
          AND t.EjercicioTrabajo = op.EjercicioTrabajo
          AND t.NumeroTrabajo = op.NumeroTrabajo
          AND t.Orden = op.Orden
          AND l.estadoLinea IN ('ACTIVO', 'PAUSADO')
    ) as SileaOperarios_EnCurso
FROM OperacionesOT op
WHERE op.CodigoEmpresa = 2 
  AND op.EjercicioTrabajo >= 2024
  AND EXISTS (
      SELECT 1 FROM SileaCenval.dbo.OrdenFabOperacionLineaTipo t_exists
      WHERE t_exists.CodigoEmpresa = op.CodigoEmpresa
        AND t_exists.EjercicioTrabajo = op.EjercicioTrabajo
        AND t_exists.NumeroTrabajo = op.NumeroTrabajo
        AND t_exists.Orden = op.Orden
  )
"""

with engine.connect() as conn:
    df = pd.read_sql(text(query), conn)
    print(df.to_string())
