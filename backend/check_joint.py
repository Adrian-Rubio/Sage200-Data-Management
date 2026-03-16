import os
import sys
import pandas as pd
from sqlalchemy import create_engine, text

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import SQLALCHEMY_DATABASE_URL

def check_joint_budget():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    # Join budgets with actual sales for March 2026
    query = """
        SELECT SUM(p.Presupuesto)
        FROM Presupuestos_AEL p
        WHERE p.Año = 2026 AND p.Mes = 3
        AND EXISTS (
            SELECT 1 FROM Vis_AEL_DiarioFactxComercial v
            WHERE v.CodigoCliente = p.CodigoCliente 
            AND v.CodigoEmpresa = '2'
            AND v.EjercicioFactura = 2026 AND MONTH(v.FechaFactura) = 3
        )
    """
    with engine.connect() as conn:
        res = conn.execute(text(query)).scalar()
        print(f"Presupuesto de clientes con VENTAS en Marzo: {res:,.2f} €")
        
if __name__ == "__main__":
    check_joint_budget()
