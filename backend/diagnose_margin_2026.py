from sqlalchemy import text
from database import SessionLocal
import pandas as pd

def diagnose():
    db = SessionLocal()
    try:
        # User filters from screenshot
        start = '2026-01-31'
        end = '2026-02-27'
        print(f"Checking data between {start} and {end} for Company 2")
        
        # 1. Total Margin Data
        query = """
        SELECT COUNT(*) as Rows, SUM(BaseImponible) as Sales, SUM(ImporteCoste) as Cost
        FROM VIS_CEN_LinAlbFacSD
        WHERE CodigoEmpresa = '2'
        AND TRY_CONVERT(date, FechaFactura) >= :start
        AND TRY_CONVERT(date, FechaFactura) <= :end
        """
        df = pd.read_sql(text(query), db.bind, params={'start': start, 'end': end})
        print("Margin View totals:")
        print(df)

        # 2. Check Reps in Margin Data
        query_reps = """
        SELECT Comisionista, SUM(BaseImponible) as Sales
        FROM VIS_CEN_LinAlbFacSD
        WHERE CodigoEmpresa = '2'
        AND TRY_CONVERT(date, FechaFactura) >= :start
        AND TRY_CONVERT(date, FechaFactura) <= :end
        GROUP BY Comisionista
        """
        df_reps = pd.read_sql(text(query_reps), db.bind, params={'start': start, 'end': end})
        print("\nReps in Margin View:")
        print(df_reps)
        
        # 3. Check Revenue Data for comparison
        query_rev = """
        SELECT COUNT(*) as Rows, SUM(BaseImponible) as Sales
        FROM Vis_AEL_DiarioFactxComercial
        WHERE CodigoEmpresa = '2'
        AND TRY_CONVERT(date, FechaFactura) >= :start
        AND TRY_CONVERT(date, FechaFactura) <= :end
        """
        df_rev = pd.read_sql(text(query_rev), db.bind, params={'start': start, 'end': end})
        print("\nRevenue View totals:")
        print(df_rev)

    finally:
        db.close()

if __name__ == '__main__':
    diagnose()
