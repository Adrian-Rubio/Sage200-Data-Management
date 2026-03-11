from database import engine
from sqlalchemy import text
import pandas as pd

query = """
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME LIKE '%Mat%' 
   OR TABLE_NAME LIKE '%Comp%'
   OR TABLE_NAME LIKE '%Articulo%'
ORDER BY TABLE_NAME
"""

try:
    df = pd.read_sql(text(query), engine)
    pd.set_option('display.max_rows', None)
    print(df)
except Exception as e:
    print(f"Error: {e}")
