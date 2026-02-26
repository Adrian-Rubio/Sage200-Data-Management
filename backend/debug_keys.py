from sqlalchemy import text
from database import SessionLocal
import pandas as pd

def check_keys():
    db = SessionLocal()
    try:
        query = """
        SELECT CodigoEmpresa, EjercicioAlbaran, SerieAlbaran, NumeroAlbaran, ImporteLiquido, StatusFacturado, FechaAlbaran
        FROM CabeceraAlbaranCliente
        WHERE SerieAlbaran = 'NAC' AND NumeroAlbaran = 2118
        """
        df = pd.read_sql(text(query), db.bind)
        print("--- Keys NAC-2118 ---")
        print(df)
        
    finally:
        db.close()

if __name__ == "__main__":
    check_keys()
