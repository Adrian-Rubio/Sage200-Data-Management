from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)

print("--- Searching for task description: 'Montaje informática basico' ---")
# Use a custom search
with engine.connect() as conn:
    tables = q("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME LIKE '%Descripcion%'")
    for table in tables['TABLE_NAME']:
        try:
            res = q(f"SELECT COUNT(*) as cnt FROM {table} WHERE DescripcionOperacion LIKE '%Montaje informática basico%'")
            if res.iloc[0]['cnt'] > 0:
                print(f"Table {table}: Found!")
                print(q(f"SELECT * FROM {table} WHERE DescripcionOperacion LIKE '%Montaje informática basico%'").to_string())
        except:
            pass
