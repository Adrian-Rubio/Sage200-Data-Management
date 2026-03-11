from database import engine
from sqlalchemy import text
import pandas as pd

query = "SELECT TOP 10 * FROM ConsumosOT"

try:
    df = pd.read_sql(text(query), engine)
    print("Columns in ConsumosOT:")
    print(df.columns.tolist())
    print("\nSample Data:")
    print(df.head())
except Exception as e:
    print(f"Error: {e}")
