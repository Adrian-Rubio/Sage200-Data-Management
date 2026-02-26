import sys
import pandas as pd
from sqlalchemy import text
import sys
import os

# Add backend dir to path so we can import database
sys.path.append(r"c:\Users\adrian.rubio\OneDrive - CENVAL S.L\Escritorio\repositorios\Data_Management\backend")

from database import engine

def main():
    try:
        with engine.connect() as conn:
            query = "SELECT TOP 1 * FROM Vis_AEL_DiarioFactxComercial"
            df = pd.read_sql(text(query), conn)
            print("Columns in Vis_AEL_DiarioFactxComercial:")
            for col in df.columns:
                print(f"- {col}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
