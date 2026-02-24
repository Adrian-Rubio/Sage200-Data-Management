from database import engine
from sqlalchemy import text
import pandas as pd

query = """
    SELECT COLUMN_NAME, DATA_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'OperacionesOT'
"""
try:
    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn)
        print(df.to_string())
except Exception as e:
    print(e)
