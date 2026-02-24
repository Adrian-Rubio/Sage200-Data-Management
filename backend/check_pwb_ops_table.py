from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)

print("--- pwb_Operarios Columns ---")
cols = q("SELECT TOP 0 * FROM pwb_Operarios")
print(cols.columns.tolist())

print("\n--- pwb_Operarios sample ---")
print(q("SELECT TOP 10 * FROM pwb_Operarios"))
