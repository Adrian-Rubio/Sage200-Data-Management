from sqlalchemy import text
from database import SessionLocal
import pandas as pd

def check_raw_cabecera():
    db = SessionLocal()
    try:
        query = """
        SELECT SerieAlbaran, NumeroAlbaran, ImporteLiquido, CodigoCliente, FechaAlbaran, StatusFacturado
        FROM CabeceraAlbaranCliente
        WHERE CodigoEmpresa = '2' AND SerieAlbaran = 'NAC' AND NumeroAlbaran = 2118
        """
        df = pd.read_sql(text(query), db.bind)
        print("--- Consulta Directa CabeceraAlbaranCliente (NAC-2118) ---")
        print(df)
        
    finally:
        db.close()

if __name__ == "__main__":
    check_raw_cabecera()
