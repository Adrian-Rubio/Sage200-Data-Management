from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn)
        return df

print("--- LcCabeceraParte Columns ---")
print(q("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'LcCabeceraParte'").to_string())

print("\n--- Example Data for Finished Order 575 in LcCabeceraParte ---")
# Adjust query if columns differ
print(q("SELECT * FROM LcCabeceraParte WHERE NumeroTrabajo = 575 AND EjercicioTrabajo = 2026"))
