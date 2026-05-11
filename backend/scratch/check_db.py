
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

SERVER = os.getenv("DB_SERVER", "localhost")
DATABASE = os.getenv("DB_DATABASE")
USER = os.getenv("DB_USER")
PASSWORD = os.getenv("DB_PASSWORD")
DRIVER = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")

SQLALCHEMY_DATABASE_URL = f"mssql+pyodbc://{USER}:{PASSWORD}@{SERVER}/{DATABASE}?driver={DRIVER}&TrustServerCertificate=yes"
engine = create_engine(SQLALCHEMY_DATABASE_URL)

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT name FROM sys.tables WHERE name = 'purchase_tracking'"))
        table_exists = result.fetchone() is not None
        print(f"Table purchase_tracking exists: {table_exists}")
        
        if not table_exists:
            print("Table does not exist. Attempting to check if CabeceraPedidoProveedor exists...")
            result = conn.execute(text("SELECT name FROM sys.tables WHERE name = 'CabeceraPedidoProveedor'"))
            print(f"Table CabeceraPedidoProveedor exists: {result.fetchone() is not None}")
except Exception as e:
    print(f"Error: {e}")
