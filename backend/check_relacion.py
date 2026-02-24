from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)

print("--- Checking RelacionOTOF for 494 ---")
# See if it maps NumeroTrabajo to something else
print(q("SELECT * FROM RelacionOTOF WHERE NumeroTrabajo = 494"))

print("\n--- Checking RelacionOTOF for 492 ---")
print(q("SELECT * FROM RelacionOTOF WHERE NumeroTrabajo = 492"))
