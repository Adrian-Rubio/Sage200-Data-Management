import os
import sys
sys.path.append(os.getcwd())

from database import engine
from sqlalchemy import text
import pandas as pd

def search_tables():
    query = """
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_NAME LIKE '%Cuent%' OR TABLE_NAME LIKE '%Plan%' OR TABLE_NAME LIKE '%Maestro%' OR TABLE_NAME LIKE '%Banc%'
    """
    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn)
        print("Matching tables:")
        print(df)
        
if __name__ == "__main__":
    search_tables()
