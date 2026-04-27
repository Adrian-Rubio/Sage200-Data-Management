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

def check():
    with engine.connect() as conn:
        for t in ['MovimientoStock', 'AcumuladoStock', 'ArticuloProveedor']:
            print(f"\nColumns in {t}:")
            try:
                df = pd.read_sql(text(f"SELECT TOP 0 * FROM {t}"), conn)
                print(df.columns.tolist()[:30])
            except:
                print("Error")

if __name__ == "__main__":
    check()
