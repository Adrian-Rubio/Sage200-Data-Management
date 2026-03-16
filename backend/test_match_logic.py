import os
import sys
import pandas as pd
from sqlalchemy import create_engine, text

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import SQLALCHEMY_DATABASE_URL

def test_match():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    rep_query = "SELECT TOP 100 CodigoCliente, Comisionista FROM Vis_AEL_DiarioFactxComercial"
    with engine.connect() as conn:
        df = pd.read_sql(text(rep_query), conn)
    
    print(f"Col type: {df['CodigoCliente'].dtype}")
    print(f"Sample: '{df['CodigoCliente'].iloc[0]}'")
    
    test_code = "1500"
    match = df[df['CodigoCliente'].astype(str).str.strip() == test_code]
    print(f"Match for 1500: {not match.empty}")

if __name__ == "__main__":
    test_match()
