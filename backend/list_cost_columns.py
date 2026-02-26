import sys
import pandas as pd
from sqlalchemy import text

sys.path.append(r"c:\Users\adrian.rubio\OneDrive - CENVAL S.L\Escritorio\repositorios\Data_Management\backend")
from database import engine

def main():
    try:
        with engine.connect() as conn:
            query = "SELECT TOP 1 * FROM CEN_PowerBI_LineasAlbaranesFacturadosSinDuplicados"
            df = pd.read_sql(text(query), conn)
            print("Columns in CEN_PowerBI_LineasAlbaranesFacturadosSinDuplicados:")
            for col in df.columns:
                print(f"- {col}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
