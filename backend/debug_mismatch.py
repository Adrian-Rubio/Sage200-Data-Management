
from sqlalchemy import text
from database import SessionLocal
import pandas as pd

def check_comisionistas():
    db = SessionLocal()
    try:
        # Check why Comisionista code 1 is duplicated
        query = "SELECT * FROM Comisionistas WHERE CodigoComisionista = '1'"
        df = pd.read_sql(text(query), db.bind)
        print("Rows for CodigoComisionista 1:")
        print(df)
        
        # Check if Clientes also has duplicates for the same code/company
        query_cli = "SELECT CodigoCliente, CodigoEmpresa, COUNT(*) as cnt FROM Clientes GROUP BY CodigoCliente, CodigoEmpresa HAVING COUNT(*) > 1"
        df_cli = pd.read_sql(text(query_cli), db.bind)
        print("\nDuplicate CodigoCliente/CodigoEmpresa in Clientes table:")
        print(df_cli.head(10))
        
    finally:
        db.close()

if __name__ == "__main__":
    check_comisionistas()
