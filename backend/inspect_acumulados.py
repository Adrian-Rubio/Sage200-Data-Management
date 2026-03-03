import os
import sys
sys.path.append(os.getcwd())

from database import engine
from sqlalchemy import text
import pandas as pd

def inspect_acumulados():
    with engine.connect() as conn:
        print("\n--- SCHEMA OF AcumuladosConta ---")
        try:
            cols_query = """
                SELECT COLUMN_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'AcumuladosConta'
            """
            cols_df = pd.read_sql(text(cols_query), conn)
            print(cols_df.to_string(index=False))
            
            print("\n--- SAMPLE DATA FROM AcumuladosConta ---")
            sample_query = "SELECT TOP 5 * FROM AcumuladosConta WHERE Ejercicio = 2024"
            sample_df = pd.read_sql(text(sample_query), conn)
            print(sample_df.to_string(index=False))
            
            print("\n--- UNIQUE COMPANIES IN AcumuladosConta ---")
            emp_query = "SELECT CodigoEmpresa, Ejercicio, COUNT(*) as Count FROM AcumuladosConta GROUP BY CodigoEmpresa, Ejercicio ORDER BY Ejercicio, CodigoEmpresa"
            emp_df = pd.read_sql(text(emp_query), conn)
            print(emp_df.to_string(index=False))
            
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    inspect_acumulados()
