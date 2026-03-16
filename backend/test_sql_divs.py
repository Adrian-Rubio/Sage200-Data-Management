import os
import sys
from sqlalchemy import create_engine, text

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import SQLALCHEMY_DATABASE_URL

def check_divs():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    query = """
        SELECT Division, SUM(Presupuesto) as Total
        FROM Presupuestos_AEL
        WHERE Mes = 3 AND Año = 2026
        GROUP BY Division
    """
    with engine.connect() as conn:
        results = conn.execute(text(query)).fetchall()
        for row in results:
            print(f"{row[0]}: {row[1]:,.2f} €")
        print(f"TOTAL: {sum(r[1] for r in results):,.2f} €")

if __name__ == "__main__":
    check_divs()
