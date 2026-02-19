import sys
sys.path.append('.')
from database import engine
from sqlalchemy import text
import pandas as pd

query = """
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME LIKE 'CabeceraAlbaran%'
ORDER BY TABLE_NAME
"""

try:
    df = pd.read_sql(text(query), engine)
    print("Found Tables/Views:")
    print(df)
except Exception as e:
    print(f"Error: {e}")
