import pandas as pd
from sqlalchemy import text
from database import engine

def analyze():
    query_cols = "SELECT TOP 1 * FROM VIS_CEN_LinAlbFacSD"
    with engine.connect() as db:
        df = pd.read_sql(text(query_cols), db)
        print('Columns in VIS_CEN_LinAlbFacSD:')
        print(df.columns.tolist())

if __name__ == '__main__':
    analyze()
