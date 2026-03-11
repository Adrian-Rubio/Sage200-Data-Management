from database import engine
from sqlalchemy import text
import pandas as pd

query = "SELECT DISTINCT EstadoOT FROM OrdenesTrabajo"

try:
    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn)
        print("All unique status values in OrdenesTrabajo:")
        print(df.to_string())
except Exception as e:
    print(f"Error: {e}")
