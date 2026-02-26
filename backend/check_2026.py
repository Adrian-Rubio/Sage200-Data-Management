from sqlalchemy import text
from database import SessionLocal
import pandas as pd

def check_2026_data():
    db = SessionLocal()
    try:
        print("--- Verificando datos de 2026 en VIS_CEN_LinAlbFacSD ---")
        query = """
        SELECT COUNT(*) as Total2026
        FROM VIS_CEN_LinAlbFacSD 
        WHERE TRY_CONVERT(date, FechaFactura) >= '2026-01-01'
        """
        df = pd.read_sql(text(query), db.bind)
        print(df)
        
        print("\n--- Verificando datos de 2026 en Vis_AEL_DiarioFactxComercial ---")
        query2 = """
        SELECT COUNT(*) as Total2026
        FROM Vis_AEL_DiarioFactxComercial 
        WHERE TRY_CONVERT(date, FechaFactura) >= '2026-01-01'
        """
        df2 = pd.read_sql(text(query2), db.bind)
        print(df2)
        
    finally:
        db.close()

if __name__ == "__main__":
    check_2026_data()
