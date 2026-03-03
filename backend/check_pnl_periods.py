import os
import sys
sys.path.append(os.getcwd())

from database import engine
from sqlalchemy import text
import pandas as pd

def check_periods():
    with engine.connect() as conn:
        q = "SELECT TOP 20 * FROM AcumuladosConta WHERE CodigoEmpresa = 100 AND Ejercicio = 2024 AND CodigoCuenta LIKE '700%'"
        df = pd.read_sql(text(q), conn)
        print(df.to_string(index=False))

if __name__ == "__main__":
    check_periods()
