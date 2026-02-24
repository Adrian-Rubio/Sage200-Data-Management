from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)

print("--- Searching for Operario 10 (DAVID) and Operario 3 (MARTA) in 2026 ---")
# 1. Get David's and Marta's IDs for sure
ops = q("SELECT Operario, NombreOperario FROM Operarios WHERE NombreOperario LIKE '%DAVID%' OR NombreOperario LIKE '%MARTA%'")
print("Target Operarios:")
print(ops)

# 2. Search for these IDs in tables that have 'Operario' column
tables = q("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME = 'Operario'")

for obj in ops.itertuples():
    print(f"\n>>> Searching for {obj.NombreOperario} (ID {obj.Operario})")
    for table in tables['TABLE_NAME']:
        try:
            # We want 2026 data
            # Check if table has year column
            cols = q(f"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{table}'")
            year_col = None
            for c in cols['COLUMN_NAME']:
                if c in ('EjercicioTrabajo', 'Año', 'Ejercicio'):
                    year_col = c
                    break
            
            where = f"Operario = {obj.Operario}"
            if year_col:
                where += f" AND {year_col} = 2026"
            
            res = q(f"SELECT COUNT(*) as cnt FROM {table} WHERE {where}")
            cnt = res.iloc[0]['cnt']
            if cnt > 0:
                print(f"  Table {table}: {cnt} rows")
                sample = q(f"SELECT TOP 3 * FROM {table} WHERE {where}")
                print(sample.to_string())
        except Exception:
            pass
