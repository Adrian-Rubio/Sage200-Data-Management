from database import engine
from sqlalchemy import text
import pandas as pd

query = """
SELECT TABLE_NAME, COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE COLUMN_NAME = 'NumeroTrabajo'
ORDER BY TABLE_NAME
"""

try:
    df = pd.read_sql(text(query), engine)
    print("Tables with NumeroTrabajo column:")
    print(df)
except Exception as e:
    print(f"Error: {e}")
