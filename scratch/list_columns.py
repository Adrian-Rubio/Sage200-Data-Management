import pandas as pd
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# Load env
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

SERVER = os.getenv("DB_SERVER")
DATABASE = os.getenv("DB_DATABASE")
USER = os.getenv("DB_USER")
PASSWORD = os.getenv("DB_PASSWORD")
DRIVER = os.getenv("DB_DRIVER")

engine = create_engine(f"mssql+pyodbc://{USER}:{PASSWORD}@{SERVER}/{DATABASE}?driver={DRIVER}&TrustServerCertificate=yes")

def list_cols():
    with engine.connect() as conn:
        print("Columns in Articulos:")
        df = pd.read_sql(text("SELECT TOP 0 * FROM Articulos"), conn)
        print(list(df.columns))
        
        print("\nColumns in Proveedores:")
        df2 = pd.read_sql(text("SELECT TOP 0 * FROM Proveedores"), conn)
        print(list(df2.columns))

if __name__ == "__main__":
    list_cols()
