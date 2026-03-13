
from sqlalchemy import text
from database import SessionLocal
import pandas as pd

def check_pk():
    db = SessionLocal()
    try:
        query = """
            SELECT NumeroAlbaran, CodigoSerie, CodigoEmpresa, EjercicioAlbaran, COUNT(*) as cnt
            FROM CabeceraAlbaranCliente
            WHERE CodigoEmpresa = '2' AND StatusFacturado = 0
            GROUP BY NumeroAlbaran, CodigoSerie, CodigoEmpresa, EjercicioAlbaran
            HAVING COUNT(*) > 1
        """
        df = pd.read_sql(text(query), db.bind)
        print("Duplicate PKs (NumeroAlbaran, CodigoSerie, CodigoEmpresa, EjercicioAlbaran):")
        print(df)
        
    finally:
        db.close()

if __name__ == "__main__":
    check_pk()
