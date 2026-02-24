from database import engine
from sqlalchemy import text
import pandas as pd

query = """
    SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME IN ('Incidencias', 'Operarios')
    ORDER BY TABLE_NAME, ORDINAL_POSITION
"""
try:
    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn)
        pd.set_option('display.max_rows', None)
        print(df.to_string())
except Exception as e:
    print(e)
