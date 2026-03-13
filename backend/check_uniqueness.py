
from sqlalchemy import text
from database import SessionLocal
import pandas as pd

def check_uniqueness():
    db = SessionLocal()
    try:
        # Check if NumeroAlbaran + SerieAlbaran + EjercicioAlbaran is unique per Empresa
        query = """
            SELECT NumeroAlbaran, SerieAlbaran, EjercicioAlbaran, CodigoEmpresa, COUNT(*) as cnt
            FROM CabeceraAlbaranCliente
            WHERE StatusFacturado = 0 AND CodigoEmpresa = '2'
            GROUP BY NumeroAlbaran, SerieAlbaran, EjercicioAlbaran, CodigoEmpresa
            HAVING COUNT(*) > 1
        """
        df = pd.read_sql(text(query), db.bind)
        if not df.empty:
            print("DUPLICATES FOUND in CabeceraAlbaranCliente (Numero, Serie, Ejercicio, Empresa):")
            print(df)
        else:
            print("CabeceraAlbaranCliente is UNIQUE by (Numero, Serie, Ejercicio, Empresa).")
            
        # Check counts
        query_counts = """
            SELECT COUNT(*) as total_rows, 
                   COUNT(DISTINCT CAST(NumeroAlbaran AS VARCHAR) + CAST(SerieAlbaran AS VARCHAR) + CAST(EjercicioAlbaran AS VARCHAR)) as unique_keys
            FROM CabeceraAlbaranCliente
            WHERE StatusFacturado = 0 AND CodigoEmpresa = '2'
        """
        df_counts = pd.read_sql(text(query_counts), db.bind)
        print("\nCounts:")
        print(df_counts)

    finally:
        db.close()

if __name__ == "__main__":
    check_uniqueness()
