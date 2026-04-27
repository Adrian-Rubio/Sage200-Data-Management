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
        print("Searching for tables with keywords...")
        keywords = ['Stock', 'Existencia', 'Movimiento', 'Historico', 'Almacen', 'Articulo']
        query = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE " + " OR ".join([f"TABLE_NAME LIKE '%{k}%'" for k in keywords])
        df = pd.read_sql(text(query), conn)
        print(df['TABLE_NAME'].tolist())

if __name__ == "__main__":
    find_tables()
