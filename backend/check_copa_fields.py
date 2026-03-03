import os
import sys
sys.path.append(os.getcwd())

from database import engine
from sqlalchemy import text
import pandas as pd

def check_copa_columns():
    query = """
    SELECT TOP 5 *
    FROM PowerBi_CarteraCoPa
    """
    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn)
        print("Columns in PowerBi_CarteraCoPa:")
        for col in df.columns:
            print(col)
        print("\nSample Data:")
        print(df.head(1).T)
        
if __name__ == "__main__":
    check_copa_columns()
