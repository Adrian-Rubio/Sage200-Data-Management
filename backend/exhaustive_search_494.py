from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)

print("--- Searching for 494 in ALL tables with NumeroTrabajo column ---")
tables = q("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME = 'NumeroTrabajo'")

for table in tables['TABLE_NAME']:
    try:
        res = q(f"SELECT COUNT(*) as cnt FROM {table} WHERE NumeroTrabajo = 494")
        cnt = res.iloc[0]['cnt']
        if cnt > 0:
            print(f"Table {table}: {cnt} rows")
            # If it has Operario or similar, peaking
            peak = q(f"SELECT TOP 5 * FROM {table} WHERE NumeroTrabajo = 494")
            print(peak.to_string())
    except Exception:
        # Some tables might fail due to schema or permissions
        pass
