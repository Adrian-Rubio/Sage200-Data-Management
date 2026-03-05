# check_account_mismatch.py
import pandas as pd
from sqlalchemy import create_engine, text
import os
import budget_parser
import re
from database import SQLALCHEMY_DATABASE_URL

# Use the same connection as the app
engine = create_engine(SQLALCHEMY_DATABASE_URL)

def check_mismatch():
    company_id = '100'
    year = 2026
    
    # 1. Real account codes from DB
    query = """
    SELECT DISTINCT CodigoCuenta 
    FROM AcumuladosConta 
    WHERE CodigoEmpresa = :company_id 
      AND Ejercicio = :year 
      AND (CodigoCuenta LIKE '6%' OR CodigoCuenta LIKE '7%')
    """
    with engine.connect() as conn:
        df_real = pd.read_sql(text(query), conn, params={"company_id": company_id, "year": year})
    real_codes = set(df_real['CodigoCuenta'].tolist())
    
    # 2. Budget account codes from Excel
    budget_data = budget_parser.get_budget_data(company_id=company_id)
    budget_codes = set(budget_data.keys())
    
    print(f"Total Real accounts in DB: {len(real_codes)}")
    print(f"Total Budget accounts in Excel: {len(budget_codes)}")
    
    # Check intersections
    intersection = real_codes & budget_codes
    print(f"\nExact matches found: {len(intersection)}")
    
    if len(intersection) == 0:
        print("\nSearching for prefix/sub-account matches...")
        matches_found = 0
        for b in sorted(list(budget_codes))[:20]: # Check some
            found = False
            for r in real_codes:
                if r.startswith(b) or b.startswith(r):
                    print(f"   Potential match: Excel '{b}' -> DB '{r}'")
                    found = True
                    matches_found += 1
                    break
        print(f"Total matches found in first 20 budget codes: {matches_found}")

if __name__ == "__main__":
    check_mismatch()
