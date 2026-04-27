import pandas as pd
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# Load env
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(base_dir, 'backend', '.env')
load_dotenv(env_path)

SERVER = os.getenv("DB_SERVER", "localhost")
DATABASE = "SileaCenval"
USER = os.getenv("DB_USER")
PASSWORD = os.getenv("DB_PASSWORD")
DRIVER = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")

engine = create_engine(f"mssql+pyodbc://{USER}:{PASSWORD}@{SERVER}/{DATABASE}?driver={DRIVER}&TrustServerCertificate=yes&ApplicationIntent=ReadOnly")

with engine.connect() as conn:
    print("Checking if any Silea lines match work_num 1342 or 1343")
    df = pd.read_sql("SELECT TOP 10 l.id, l.estadoLinea, t.EjercicioTrabajo, t.NumeroTrabajo, t.Orden FROM OrdenFabOperacionLinea l JOIN OrdenFabOperacionLineaTipo t ON l.idOperacion = t.orden_fab_operacion_id WHERE t.NumeroTrabajo IN (1342, 1343)", conn)
    print(df)
    
    print("\nChecking any works with ACTIVO state")
    df2 = pd.read_sql("SELECT TOP 5 l.id, l.estadoLinea, t.EjercicioTrabajo, t.NumeroTrabajo, t.Orden FROM OrdenFabOperacionLinea l JOIN OrdenFabOperacionLineaTipo t ON l.idOperacion = t.orden_fab_operacion_id WHERE l.estadoLinea IN ('ACTIVO', 'PAUSADO') ORDER BY l.fechaInicio DESC", conn)
    print(df2)
