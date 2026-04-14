import pandas as pd
from sqlalchemy import text
from database import engine

def analyze():
    query_cols = "SELECT TOP 1 * FROM Vis_AEL_DiarioFactxComercial"
    with engine.connect() as db:
        df = pd.read_sql(text(query_cols), db)
        print('Columns in Vis_AEL_DiarioFactxComercial:')
        print(df.columns.tolist())

if __name__ == '__main__':
    analyze()
