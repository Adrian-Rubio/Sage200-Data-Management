import os
import sys
sys.path.append(os.getcwd())

from database import engine
from sqlalchemy import text
import pandas as pd

def search_cen_views():
    with engine.connect() as conn:
        query = """
            SELECT name AS VIEW_NAME 
            FROM sys.views
            WHERE name LIKE '%CEN_PowerBi%' OR name LIKE '%pwb_%' OR name LIKE '%Efectos%' OR name LIKE '%Cartera%' OR name LIKE '%Cuenta%'
        """
        try:
            df = pd.read_sql(text(query), conn)
            print("Relevant Views/Tables found:")
            print(df.to_string())
            
            # Let's check columns of pwb_EfectoCobro
            print("\n--- Columns in pwb_EfectoCobro ---")
            try:
                col_query = "SELECT TOP 1 * FROM pwb_EfectoCobro"
                cols_df = pd.read_sql(text(col_query), conn)
                print(cols_df.columns.tolist())
            except Exception as e:
                print(e)

            # Let's check columns of pwb_EfectoPago
            print("\n--- Columns in pwb_EfectoPago ---")
            try:
                col_query = "SELECT TOP 1 * FROM pwb_EfectoPago"
                cols_df = pd.read_sql(text(col_query), conn)
                print(cols_df.columns.tolist())
            except Exception as e:
                print(e)
                
            # Let's check columns of CarteraEfectos
            print("\n--- Columns in CarteraEfectos ---")
            try:
                col_query = "SELECT TOP 1 * FROM CarteraEfectos"
                cols_df = pd.read_sql(text(col_query), conn)
                print(cols_df.columns.tolist())
            except Exception as e:
                print(e)
                
            # Let's check columns of CEN_ views related to finance if they exist
            
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    search_cen_views()
