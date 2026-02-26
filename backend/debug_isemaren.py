from sqlalchemy import text
from database import SessionLocal
import pandas as pd

def check_albaran_status():
    db = SessionLocal()
    try:
        query = """
        SELECT k.SerieAlbaran, k.NumeroAlbaran, k.StatusFacturado, k.ImporteLiquido, c.RazonSocial, k.FechaAlbaran
        FROM CabeceraAlbaranCliente k
        JOIN Clientes c ON k.CodigoCliente = c.CodigoCliente AND k.CodigoEmpresa = c.CodigoEmpresa
        WHERE c.RazonSocial LIKE '%ISEMAREN%' AND k.CodigoEmpresa = '2'
        """
        df = pd.read_sql(text(query), db.bind)
        print("--- Albaranes de ISEMAREN ---")
        print(df)
        
        query_sum = """
        SELECT SUM(ImporteLiquido) as Total
        FROM CabeceraAlbaranCliente k
        JOIN Clientes c ON k.CodigoCliente = c.CodigoCliente AND k.CodigoEmpresa = c.CodigoEmpresa
        WHERE k.StatusFacturado = 0 AND k.CodigoEmpresa = '2' AND c.RazonSocial LIKE '%ISEMAREN%'
        """
        total = db.execute(text(query_sum)).scalar()
        print(f"\nTotal Pendiente Facturar (StatusFacturado=0): {total}")
        
    finally:
        db.close()

if __name__ == "__main__":
    check_albaran_status()
