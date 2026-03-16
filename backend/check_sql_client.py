import os
import sys
import pandas as pd
from sqlalchemy import create_engine, text

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import SQLALCHEMY_DATABASE_URL

def check_sql_rows():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    query = "SELECT Division, Mes, SUM(Presupuesto) as Suma FROM Presupuestos_AEL WHERE CodigoCliente = '25825' AND Año = 2026 GROUP BY Division, Mes ORDER BY Division, Mes"
    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn)
        print(df)

if __name__ == "__main__":
    check_sql_rows()
