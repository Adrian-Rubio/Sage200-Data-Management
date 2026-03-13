
from sqlalchemy import text
from database import SessionLocal
import pandas as pd

def deep_dive():
    db = SessionLocal()
    try:
        rep_name = 'JUAN CARLOS BENITO RAMOS'
        
        # 1. Check comisionista codes for this name in Company 2
        query_coms = """
            SELECT CodigoComisionista, Comisionista, CodigoEmpresa
            FROM Comisionistas
            WHERE UPPER(RTRIM(LTRIM(Comisionista))) = :name AND CodigoEmpresa = '2'
        """
        df_coms = pd.read_sql(text(query_coms), db.bind, params={"name": rep_name})
        print(f"Comisionista codes for {rep_name} in Company 2:")
        print(df_coms)
        
        # 2. Check all pending invoices for these codes
        codes = df_coms['CodigoComisionista'].tolist()
        if not codes:
            print("No codes found.")
            return
            
        placeholders = [f"'{c}'" for c in codes]
        query_alb = f"""
            SELECT k.NumeroAlbaran, k.CodigoSerie, k.ImporteLiquido, k.CodigoComisionista, c.RazonSocial
            FROM CabeceraAlbaranCliente k
            JOIN Clientes c ON k.CodigoCliente = c.CodigoCliente AND k.CodigoEmpresa = c.CodigoEmpresa
            WHERE k.StatusFacturado = 0 AND k.CodigoEmpresa = '2'
            AND k.CodigoComisionista IN ({','.join(placeholders)})
        """
        df_alb = pd.read_sql(text(query_alb), db.bind)
        print(f"\nPending Albaranes count: {len(df_alb)}")
        print(f"Total Amount (Sum of ImporteLiquido): {df_alb['ImporteLiquido'].sum():.2f}")
        
        # 3. Check for duplicates (Multiple rows per NumeroAlbaran+CodigoSerie)
        duplicates = df_alb.groupby(['NumeroAlbaran', 'CodigoSerie']).size().reset_index(name='count')
        duplicates = duplicates[duplicates['count'] > 1]
        print(f"\nDuplicate Albaranes (Numero+Serie): {len(duplicates)}")
        if not duplicates.empty:
            print("Example duplicates:")
            print(duplicates.head(5))
            
            # Why are they duplicated?
            num = duplicates.iloc[0]['NumeroAlbaran']
            serie = duplicates.iloc[0]['CodigoSerie']
            query_why = """
                SELECT * FROM CabeceraAlbaranCliente 
                WHERE NumeroAlbaran = :num AND CodigoSerie = :serie AND CodigoEmpresa = '2'
            """
            df_why = pd.read_sql(text(query_why), db.bind, params={"num": num, "serie": serie})
            print(f"\nWhy duplication? Detail for Albaran {num} Serie {serie}:")
            print(df_why)

    finally:
        db.close()

if __name__ == "__main__":
    deep_dive()
