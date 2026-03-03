import os
import sys
sys.path.append(os.getcwd())

from database import engine
from sqlalchemy import text
import pandas as pd

def inspect_view_definitions():
    views = [
        "PowerBi_CarteraCoPa",
        "Vista_CuentaExplotacion"
    ]
    
    with engine.connect() as conn:
        for view in views:
            print(f"\n{'='*50}\nVIEW: {view}\n{'='*50}")
            try:
                # Get definition
                def_query = f"""
                    SELECT definition 
                    FROM sys.sql_modules 
                    WHERE object_id = OBJECT_ID('{view}')
                """
                def_df = pd.read_sql(text(def_query), conn)
                if not def_df.empty:
                    print("--- DEFINITION ---")
                    print(def_df.iloc[0]['definition'])
                else:
                    print("No definition found in sys.sql_modules.")
            except Exception as e:
                print(f"Error inspecting {view}: {e}")

if __name__ == "__main__":
    inspect_view_definitions()
