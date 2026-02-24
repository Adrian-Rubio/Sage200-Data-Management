from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)

print("--- Operario 20 ---")
print(q("SELECT * FROM Operarios WHERE Operario = 20"))
