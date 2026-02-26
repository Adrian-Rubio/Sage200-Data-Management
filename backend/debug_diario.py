from sqlalchemy import text
from database import SessionLocal
import pandas as pd

def check_raw_diario():
    db = SessionLocal()
    try:
        query = """
        SELECT Comisionista, SUM(BaseImponible) as Total
        FROM Vis_AEL_DiarioFactxComercial
        WHERE CodigoEmpresa = '2'
        GROUP BY Comisionista
        """
        df = pd.read_sql(text(query), db.bind)
        print("--- Facturación por Comercial (Vista Diario) Empresa 2 ---")
        print(df)
        
        print("\n--- Buscando facturas de ISEMAREN en Diario ---")
        query_isemaren = """
        SELECT * FROM Vis_AEL_DiarioFactxComercial 
        WHERE CodigoEmpresa = '2' AND RazonSocial LIKE '%ISEMAREN%'
        """
        df_isem = pd.read_sql(text(query_isemaren), db.bind)
        print(df_isem)
        
    finally:
        db.close()

if __name__ == "__main__":
    check_raw_diario()
