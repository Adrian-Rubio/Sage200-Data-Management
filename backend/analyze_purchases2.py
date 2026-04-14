import pandas as pd
from sqlalchemy import text
from database import engine

def analyze():
    query_purch = "SELECT SUM(BaseImponible) as Total FROM PowerBi_ComprasDetalle WHERE CodigoEmpresa IN ('2', 2) AND CAST(Fecha AS DATE) >= '2026-01-01' AND CAST(Fecha AS DATE) <= '2026-01-31'"
    with engine.connect() as db:
        df = pd.read_sql(text(query_purch), db)
    
    total_purchases = df['Total'].iloc[0]
    print(f'Total Purchases Jan 2026: {total_purchases:,.2f}')

if __name__ == '__main__':
    analyze()
