import os
import sys
sys.path.append(os.getcwd())

from database import SessionLocal
from sqlalchemy import text
import pandas as pd

db = SessionLocal()

query = """
    SELECT EjercicioPedido, SUM(BaseImponiblePendiente) as Total, COUNT(DISTINCT NumeroPedido) as Pedidos
    FROM CEN_PowerBi_LineasPedVen_Vendedor
    WHERE CodigoEmpresa = '2' AND UnidadesPendientes > 0
    AND UPPER(RTRIM(LTRIM(CodigoComisionista))) IN (
        SELECT CodigoComisionista FROM Comisionistas WHERE Comisionista LIKE '%BENITO%'
    )
    GROUP BY EjercicioPedido
    ORDER BY EjercicioPedido
"""

try:
    df = pd.read_sql(text(query), db.bind)
    print("Pending Orders by Year for JUAN CARLOS BENITO RAMOS in Company 2:")
    print(df)
    
except Exception as e:
    print("ERROR:", e)
finally:
    db.close()
