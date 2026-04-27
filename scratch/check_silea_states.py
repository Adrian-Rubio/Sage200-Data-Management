import pandas as pd
from sqlalchemy import create_engine
import os, sys
from dotenv import load_dotenv

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(base_dir, 'backend', '.env')
load_dotenv(env_path)

SERVER = os.getenv("DB_SERVER", "localhost")
DATABASE = "SileaCenval"
USER = os.getenv("DB_USER")
PASSWORD = os.getenv("DB_PASSWORD")
DRIVER = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")

conn_str = f"mssql+pyodbc://{USER}:{PASSWORD}@{SERVER}/{DATABASE}?driver={DRIVER}&TrustServerCertificate=yes&ApplicationIntent=ReadOnly"
engine = create_engine(conn_str)

with engine.connect() as conn:
    df = pd.read_sql("SELECT DISTINCT estadoLinea FROM OrdenFabOperacionLinea", conn)
    print(df)
