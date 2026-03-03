import os
import sys
sys.path.append(os.getcwd())

from database import engine
from sqlalchemy import text
import pandas as pd

def check_otros_content():
    # Let's see what accounts fall into 'Otros'
    query = """
    SELECT 
        LEFT(CodigoCuenta, 1) as Grupo,
        SUM(HaberAcum - DebeAcum) as Saldo
    FROM AcumuladosConta
    WHERE CodigoEmpresa = 100
      AND Ejercicio = 2025
      AND NumeroPeriodo = 12
    GROUP BY LEFT(CodigoCuenta, 1)
    ORDER BY Grupo
    """
    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn)
        print("Accumulated Balances by Account Group (1st digit):")
        print(df)

if __name__ == "__main__":
    check_otros_content()
