from sqlalchemy import text
from database import SessionLocal
import pandas as pd

def check_raw_cabecera_dupes():
    db = SessionLocal()
    try:
        query = """
        SELECT SerieAlbaran, NumeroAlbaran, ImporteLiquido, CodigoCliente, FechaAlbaran, StatusFacturado, CodigoEmpresa
        FROM CabeceraAlbaranCliente
        WHERE SerieAlbaran = 'NAC' AND NumeroAlbaran = 2118
        """
        df = pd.read_sql(text(query), db.bind)
        print("--- Duplicados NAC-2118 ---")
        print(df)
        
    finally:
        db.close()

if __name__ == "__main__":
    check_raw_cabecera_dupes()
