
from sqlalchemy import text
from database import SessionLocal
import pandas as pd

def check_final():
    db = SessionLocal()
    try:
        rep = 'JUAN CARLOS BENITO RAMOS'
        # Final combined query logic
        query = f"""
            SELECT k.NumeroAlbaran, k.CodigoSerie, k.ImporteLiquido
            FROM CabeceraAlbaranCliente k 
            JOIN Comisionistas com ON k.CodigoComisionista = com.CodigoComisionista AND k.CodigoEmpresa = com.CodigoEmpresa
            WHERE k.StatusFacturado = 0 AND k.CodigoEmpresa = '2'
            AND UPPER(RTRIM(LTRIM(com.Comisionista))) = :rep
        """
        df = pd.read_sql(text(query), db.bind, params={"rep": rep})
        print(f"Total Pending for {rep}: {df['ImporteLiquido'].sum():.2f}")
        print(f"Number of rows: {len(df)}")
        print(f"Distinct Albaranes (Numero+Serie): {len(df.groupby(['NumeroAlbaran', 'CodigoSerie']))}")
        
    finally:
        db.close()

if __name__ == "__main__":
    check_final()
