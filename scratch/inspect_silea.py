import os
import sys
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv

# Add parent directory to path to load .env
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(base_dir)
env_path = os.path.join(base_dir, 'backend', '.env')
load_dotenv(env_path)

SERVER = os.getenv("DB_SERVER", "localhost")
DATABASE = "SileaCenval"
USER = os.getenv("DB_USER")
PASSWORD = os.getenv("DB_PASSWORD")
DRIVER = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")

conn_str = f"mssql+pyodbc://{USER}:{PASSWORD}@{SERVER}/{DATABASE}?driver={DRIVER}&TrustServerCertificate=yes&ApplicationIntent=ReadOnly"
engine = create_engine(conn_str)

tables = [
    "Operaciones",
    "operario_orden_fab_linea",
    "OrdenFabCab",
    "OrdenFabOperacion",
    "OrdenFabOperacionLinea",
    "OrdenFabOperacionLineaParadas",
    "OrdenFabOperacionLineaParadasTipo",
    "OrdenFabOperacionLineaPeriodos",
    "OrdenFabOperacionLineaTipo"
]

def inspect_tables():
    with engine.connect() as conn:
        for t in tables:
            print(f"\n{'='*50}")
            print(f"TABLE: {t}")
            print(f"{'='*50}")
            
            # Check if table exists
            try:
                # Schema
                schema_df = pd.read_sql(f"""
                    SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = '{t}'
                """, conn)
                print("\n-- SCHEMA --")
                print(schema_df.to_string(index=False))
                
                # Row count
                count_df = pd.read_sql(f"SELECT COUNT(*) as row_count FROM {t}", conn)
                print(f"\n-- ROW COUNT: {count_df['row_count'].values[0]} --")
                
                # Top 5 rows
                if count_df['row_count'].values[0] > 0:
                    top5_df = pd.read_sql(f"SELECT TOP 5 * FROM {t}", conn)
                    print("\n-- SAMPLE DATA --")
                    print(top5_df.to_string(index=False, max_cols=None))
                    
            except Exception as e:
                print(f"Error reading table {t}: {e}")

if __name__ == "__main__":
    inspect_tables()
