import pandas as pd
from sqlalchemy import text
from database import engine

def analyze():
    # Let's explore the Articulos table or any costs table.
    query = """
    SELECT TOP 1 *
    FROM Articulos
    """
    with engine.connect() as db:
        df = pd.read_sql(text(query), db)
        print("Columns in Articulos:")
        print(df.columns.tolist())

if __name__ == '__main__':
    analyze()
