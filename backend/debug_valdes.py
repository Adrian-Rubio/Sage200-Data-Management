from sqlalchemy import text
from database import SessionLocal
import pandas as pd

def check_comercial_isemaren():
    db = SessionLocal()
    try:
        query = """
        SELECT k.SerieAlbaran, k.NumeroAlbaran, k.StatusFacturado, k.ImporteLiquido, 
               c.RazonSocial, k.CodigoComisionista, com.Comisionista
        FROM CabeceraAlbaranCliente k
        JOIN Clientes c ON k.CodigoCliente = c.CodigoCliente AND k.CodigoEmpresa = c.CodigoEmpresa
        JOIN Comisionistas com ON k.CodigoComisionista = com.CodigoComisionista
        WHERE c.RazonSocial LIKE '%ISEMAREN%' AND k.CodigoEmpresa = '2'
        """
        df = pd.read_sql(text(query), db.bind)
        print("--- Detalle Albaran ISEMAREN ---")
        print(df)
        
        print("\n--- Buscando todos los pendientes de 'JUAN CARLOS VALDES ANTON' ---")
        query_all_valdes = """
        SELECT k.SerieAlbaran, k.NumeroAlbaran, k.ImporteLiquido, c.RazonSocial
        FROM CabeceraAlbaranCliente k
        JOIN Clientes c ON k.CodigoCliente = c.CodigoCliente AND k.CodigoEmpresa = c.CodigoEmpresa
        JOIN Comisionistas com ON k.CodigoComisionista = com.CodigoComisionista
        WHERE k.StatusFacturado = 0 AND k.CodigoEmpresa = '2' 
        AND UPPER(RTRIM(LTRIM(com.Comisionista))) = 'JUAN CARLOS VALDES ANTON'
        """
        df_valdes = pd.read_sql(text(query_all_valdes), db.bind)
        print(df_valdes)
        print(f"\nSuma Total: {df_valdes['ImporteLiquido'].sum()}")
        
    finally:
        db.close()

if __name__ == "__main__":
    check_comercial_isemaren()
