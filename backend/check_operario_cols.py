from database import engine
from sqlalchemy import text
import pandas as pd

def check_cols(table):
    print(f"\n--- Columns in {table} containing 'perario' or 'Empleado' ---")
    query = f"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{table}' AND (COLUMN_NAME LIKE '%perario%' OR COLUMN_NAME LIKE '%Empleado%')"
    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn)
        print(df)

check_cols('OperacionesOT')
check_cols('OrdenesTrabajo')
check_cols('OrdenesFabricacion')
