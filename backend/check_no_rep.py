import os
import sys
import pandas as pd
from sqlalchemy import create_engine, text

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import SQLALCHEMY_DATABASE_URL

def check_no_asignado():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    query = "SELECT SUM(Presupuesto) FROM Presupuestos_AEL WHERE Año=2026 AND Mes=3 AND Comercial='NO ASIGNADO'"
    with engine.connect() as conn:
        res = conn.execute(text(query)).scalar()
        print(f"Suma de 'NO ASIGNADO' para Marzo: {res:,.2f} €")
        
    query_total = "SELECT SUM(Presupuesto) FROM Presupuestos_AEL WHERE Año=2026 AND Mes=3"
    with engine.connect() as conn:
        res_total = conn.execute(text(query_total)).scalar()
        print(f"Suma Total para Marzo: {res_total:,.2f} €")

if __name__ == "__main__":
    check_no_asignado()
