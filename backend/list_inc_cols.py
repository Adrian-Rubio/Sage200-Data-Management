from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn)
        return df

print("--- Incidencias Columns ---")
cols = q("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Incidencias'")
print(cols.to_string())
