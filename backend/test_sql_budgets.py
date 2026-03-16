import os
import sys
import json
from sqlalchemy import create_engine, text

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import SQLALCHEMY_DATABASE_URL

def test_global_budget():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    # Test for March 2026 as per user screenshot (01/03 to 30/03)
    # The user expected around 1.2M but got 2.2M
    
    query = """
        SELECT SUM(Presupuesto) as Total
        FROM Presupuestos_AEL
        WHERE Mes = 3 AND Año = 2026
    """
    
    with engine.connect() as conn:
        result = conn.execute(text(query)).fetchone()
        print(f"Presupuesto Total SQL (Marzo 2026): {result[0]:,.2f} €")

if __name__ == "__main__":
    test_global_budget()
