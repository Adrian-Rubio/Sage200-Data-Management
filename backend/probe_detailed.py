# probe_detailed.py
import sys
import os
# Add backend to path to import local modules
sys.path.append(os.path.join(os.getcwd(), 'backend'))

import budget_parser
import pandas as pd
from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL

def probe():
    company_id = '100'
    month_from = 1
    month_to = 3
    year = 2026
    
    print(f"PROBE: Company={company_id}, Range={month_from}-{month_to}, Year={year}")
    
    # 1. Get Budget Data
    budget_data = budget_parser.get_budget_data(company_id=company_id)
    print(f"Budget accounts found: {len(budget_data)}")
    
    # 2. Get Real Data sample
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    query = """
    SELECT TOP 50 CodigoCuenta, HaberAcum - DebeAcum as Saldo
    FROM AcumuladosConta
    WHERE CodigoEmpresa = :company_id AND Ejercicio = :year AND NumeroPeriodo = :month
    AND (CodigoCuenta LIKE '6%' OR CodigoCuenta LIKE '7%')
    """
    with engine.connect() as conn:
        df_real = pd.read_sql(text(query), conn, params={"company_id": company_id, "year": year, "month": month_to})
    
    print(f"Sample Real accounts: {len(df_real)}")
    
    matches = 0
    for idx, row in df_real.iterrows():
        acc = str(row['CodigoCuenta']).strip()
        p, a = budget_parser.get_account_budget(acc, month_from, month_to, company_id=company_id)
        if p != 0:
            print(f"MATCH: Account {acc} has Budget Period={p}")
            matches += 1
            
    print(f"Total matches in sample: {matches}")
    
    if matches == 0:
        print("\nDIAGNOSIS: No matches between real sample and budget.")
        print("Budget Keys Sample:", list(budget_data.keys())[:10])
        print("Real Codes Sample:", df_real['CodigoCuenta'].tolist()[:10])

if __name__ == "__main__":
    probe()
