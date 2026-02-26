from sqlalchemy import text
from database import SessionLocal
import pandas as pd

def check_structure():
    db = SessionLocal()
    try:
        print("--- Columnas de CabeceraAlbaranCliente ---")
        query = "SELECT TOP 1 * FROM CabeceraAlbaranCliente"
        df = pd.read_sql(text(query), db.bind)
        print(df.columns)
        
    finally:
        db.close()

if __name__ == "__main__":
    check_structure()
