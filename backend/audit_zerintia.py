from sqlalchemy import text
from database import SessionLocal
import pandas as pd

def check_zerintia():
    db = SessionLocal()
    try:
        query = """
        SELECT k.SerieAlbaran, k.NumeroAlbaran, k.ImporteLiquido, c.RazonSocial, k.FechaAlbaran, k.StatusFacturado
        FROM CabeceraAlbaranCliente k
        JOIN Clientes c ON k.CodigoCliente = c.CodigoCliente AND k.CodigoEmpresa = c.CodigoEmpresa
        JOIN Comisionistas com ON k.CodigoComisionista = com.CodigoComisionista
        WHERE k.CodigoEmpresa = '2' 
        AND UPPER(RTRIM(LTRIM(com.Comisionista))) = 'JUAN CARLOS VALDES ANTON'
        AND c.RazonSocial LIKE '%ZERINTIA%'
        """
        df = pd.read_sql(text(query), db.bind)
        print("--- Auditoria ZERINTIA para Valdes ---")
        print(df)
        
    finally:
        db.close()

if __name__ == "__main__":
    check_zerintia()
