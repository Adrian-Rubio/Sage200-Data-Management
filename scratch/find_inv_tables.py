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

def find_tables():
    with engine.connect() as conn:
        print("Checking tables related to Stock/Existencias:")
        df = pd.read_sql(text("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME IN ('Stocks', 'Existencias', 'HistoricoMovimientos', 'Movimientos')"), conn)
        print(df)
        
        for table in df['TABLE_NAME']:
            print(f"\nColumns in {table}:")
            try:
                cols = pd.read_sql(text(f"SELECT TOP 0 * FROM {table}"), conn).columns.tolist()
                print(cols[:20], "...") # Print first 20
            except:
                print("Error reading columns")

if __name__ == "__main__":
    find_tables()
