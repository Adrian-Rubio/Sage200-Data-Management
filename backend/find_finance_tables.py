import os
import sys
sys.path.append(os.getcwd())

from database import engine
from sqlalchemy import text
import pandas as pd

def search_tables(keywords):
    with engine.connect() as conn:
        query = """
            SELECT name AS TABLE_NAME 
            FROM sys.tables
        """
        try:
            df = pd.read_sql(text(query), conn)
            print(f"Total tables found: {len(df)}")
            
            print("\nMatching tables:")
            for keyword in keywords:
                matches = df[df['TABLE_NAME'].str.contains(keyword, case=False, na=False)]
                if not matches.empty:
                    print(f"\n--- Keyword: {keyword} ---")
                    for _, row in matches.iterrows():
                        print(row['TABLE_NAME'])
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    keywords = [
        "Prevision", "Cobro", "Pago", "Efecto", "Cartera", "Financier", 
        "Contable", "Contabil", "Cuenta", "Subcuenta", "Asiento", 
        "Diario", "Mayor", "Explotacion", "Balance", "Saldo", "Cenval"
    ]
    search_tables(keywords)
