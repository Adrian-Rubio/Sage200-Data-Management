from sqlalchemy import text
from database import SessionLocal
import pandas as pd

def diagnose_feb_2026():
    db = SessionLocal()
    try:
        print("--- Diagnosticando VIS_CEN_LinAlbFacSD para Feb 2026 ---")
        query = """
        SELECT TOP 5 * 
        FROM VIS_CEN_LinAlbFacSD 
        WHERE CodigoEmpresa = '2' 
        AND TRY_CONVERT(date, FechaFactura) >= '2026-02-01'
        """
        df = pd.read_sql(text(query), db.bind)
        if df.empty:
            print("¡AVISO: No hay datos en VIS_CEN_LinAlbFacSD para Feb 2026 y Empresa 2!")
            # Check without company filter
            print("\n--- Sin filtro de empresa ---")
            query_all = "SELECT TOP 5 CodigoEmpresa, FechaFactura FROM VIS_CEN_LinAlbFacSD WHERE TRY_CONVERT(date, FechaFactura) >= '2026-02-01'"
            df_all = pd.read_sql(text(query_all), db.bind)
            print(df_all)
        else:
            print("Columnas encontradas:", df.columns.tolist())
            print(df)
            
    finally:
        db.close()

if __name__ == "__main__":
    diagnose_feb_2026()
