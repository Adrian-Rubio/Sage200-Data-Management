from database import engine
import pandas as pd
from sqlalchemy import text

def inspect_columns():
    tables = ['CabeceraPedidoProveedor', 'LineasPedidoProveedor']
    for table in tables:
        print(f"\n--- Columns in {table} ---")
        try:
            df = pd.read_sql(text(f"SELECT TOP 1 * FROM {table}"), engine)
            for col in df.columns:
                print(f"- {col}")
        except Exception as e:
            print(f"Error inspecting {table}: {e}")

if __name__ == "__main__":
    inspect_columns()
