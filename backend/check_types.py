from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)

print("--- Data Types ---")
print(q("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'OrdenesTrabajo' AND COLUMN_NAME IN ('NumeroTrabajo', 'NumeroFabricacion')"))
