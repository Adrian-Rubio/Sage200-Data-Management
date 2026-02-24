from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)

print("--- pwb_Partes Columns ---")
try:
    cols = q("SELECT TOP 0 * FROM pwb_Partes")
    print(cols.columns.tolist())
    
    print("\n--- pwb_Partes Sample ---")
    print(q("SELECT TOP 10 * FROM pwb_Partes"))
except Exception as e:
    print(f"Error: {e}")
