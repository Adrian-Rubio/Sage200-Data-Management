from sqlalchemy import text
from database import SessionLocal
import pandas as pd

def check_margin_data():
    db = SessionLocal()
    try:
        print("--- Verificando VIS_CEN_LinAlbFacSD para Empresa 2 ---")
        query = """
        SELECT TOP 10 
            CodigoEmpresa, 
            FechaFactura, 
            BaseImponible, 
            ImporteCoste, 
            Comisionista 
        FROM VIS_CEN_LinAlbFacSD 
        WHERE CodigoEmpresa = '2'
        """
        df = pd.read_sql(text(query), db.bind)
        if df.empty:
            print("¡AVISO: La vista VIS_CEN_LinAlbFacSD está VACÍA para CodigoEmpresa='2'!")
        else:
            print(df)
            
        print("\n--- Conteo total por Empresa ---")
        query_count = "SELECT CodigoEmpresa, COUNT(*) as Total FROM VIS_CEN_LinAlbFacSD GROUP BY CodigoEmpresa"
        df_count = pd.read_sql(text(query_count), db.bind)
        print(df_count)
        
    finally:
        db.close()

if __name__ == "__main__":
    check_margin_data()
