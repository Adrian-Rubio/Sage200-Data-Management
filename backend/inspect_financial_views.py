import os
import sys
sys.path.append(os.getcwd())

from database import engine
from sqlalchemy import text
import pandas as pd

def inspect_views():
    views = [
        "PowerBi_CarteraCoPa",
        "Vista_CuentaExplotacion"
    ]
    
    with engine.connect() as conn:
        for view in views:
            print(f"\n{'='*50}\nVIEW: {view}\n{'='*50}")
            try:
                # Get columns
                cols_query = f"""
                    SELECT COLUMN_NAME, DATA_TYPE 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = '{view}'
                """
                cols_df = pd.read_sql(text(cols_query), conn)
                print("--- SCHEMA ---")
                print(cols_df.to_string(index=False))
                
                # Get sample data
                sample_query = f"SELECT TOP 3 * FROM {view}"
                sample_df = pd.read_sql(text(sample_query), conn)
                print("\n--- SAMPLE DATA ---")
                print(sample_df.to_string(index=False))
                
                # For Cartera, check if it has state/pending fields
                if view == "PowerBi_CarteraCoPa":
                    print("\n--- DATA DISTRIBUTION ---")
                    # Check unique values in TipoEfecto or similar
                    try:
                        tipo_query = f"SELECT TipoCartera, COUNT(*) as Count, SUM(ImportePendiente) as TotalPendiente FROM {view} GROUP BY TipoCartera"
                        tipo_df = pd.read_sql(text(tipo_query), conn)
                        print(tipo_df)
                    except Exception as e:
                        print(f"Could not check TipoCartera: {e}")
                        
            except Exception as e:
                print(f"Error inspecting {view}: {e}")

if __name__ == "__main__":
    inspect_views()
