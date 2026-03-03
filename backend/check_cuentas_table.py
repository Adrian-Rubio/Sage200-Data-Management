import os
import sys
sys.path.append(os.getcwd())

from database import engine
from sqlalchemy import text
import pandas as pd

def check_cuentas():
    query = """
    SELECT TOP 5 CodigoCuenta, Descripcion
    FROM Cuentas
    WHERE CodigoEmpresa = 100 AND CodigoCuenta LIKE '572%'
    """
    with engine.connect() as conn:
        try:
            df = pd.read_sql(text(query), conn)
            print("Columns in Cuentas:")
            print(df)
        except Exception as e:
            print("Error querying Cuentas:", e)
        
if __name__ == "__main__":
    check_cuentas()
