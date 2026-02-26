from sqlalchemy import text
from database import SessionLocal
import pandas as pd
from datetime import date

def final_diagnose():
    db = SessionLocal()
    try:
        # User filters: 2026-01-31 to 2026-02-27
        start = date(2026, 1, 31)
        end = date(2026, 2, 27)
        
        # Reps for Conectrónica
        reps = ['JOSE CESPEDES BLANCO', 'ANTONIO MACHO MACHO', 'JESUS COLLADO ARAQUE', 'ADRIÁN ROMERO JIMENEZ']
        # The DB seems to use ADRIN instead of ADRIÁN in some cases.
        # Let's check what's in the DB for him.
        
        where = "WHERE CodigoEmpresa = '2' AND TRY_CONVERT(date, FechaFactura) >= :start AND TRY_CONVERT(date, FechaFactura) <= :end"
        
        params = {"start": start, "end": end}
        
        print("--- Testing VIS_CEN_LinAlbFacSD ---")
        q = f"SELECT Comisionista, SUM(BaseImponible) as V, SUM(ImporteCoste) as C FROM VIS_CEN_LinAlbFacSD {where} GROUP BY Comisionista"
        df = pd.read_sql(text(q), db.bind, params=params)
        print(df)
        
        # Test the IN clause specifically
        # placeholders = [f"'{r}'" for r in reps]
        # where_in = where + f" AND UPPER(RTRIM(LTRIM(Comisionista))) IN ({', '.join(placeholders)})"
        # q_in = f"SELECT SUM(BaseImponible) FROM VIS_CEN_LinAlbFacSD {where_in}"
        # print("Sum with IN clause:", pd.read_sql(text(q_in), db.bind, params=params))

    finally:
        db.close()

if __name__ == "__main__":
    final_diagnose()
