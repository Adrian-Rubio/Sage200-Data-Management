import os
import sys
sys.path.append(os.getcwd())

from database import SessionLocal
from sqlalchemy import text
import pandas as pd

db = SessionLocal()

query = """
    SELECT CodigoEmpresa, SUM(BaseImponiblePendiente) as TotalPendiente, COUNT(DISTINCT NumeroPedido) as NumPedidos
    FROM CEN_PowerBi_LineasPedVen_Vendedor
    WHERE UnidadesPendientes > 0
    AND UPPER(RTRIM(LTRIM(CodigoComisionista))) IN (
        SELECT CodigoComisionista FROM Comisionistas WHERE Comisionista LIKE '%BENITO%'
    )
    GROUP BY CodigoEmpresa
"""

try:
    df = pd.read_sql(text(query), db.bind)
    print("Breakdown for JUAN CARLOS BENITO RAMOS:")
    print(df)
    
    # Let's also check globally
    query_global = """
        SELECT CodigoEmpresa, SUM(BaseImponiblePendiente) as TotalPendiente, COUNT(DISTINCT NumeroPedido) as NumPedidos
        FROM CEN_PowerBi_LineasPedVen_Vendedor
        WHERE UnidadesPendientes > 0
        GROUP BY CodigoEmpresa
    """
    df_global = pd.read_sql(text(query_global), db.bind)
    print("\nGlobal Breakdown by Company:")
    print(df_global)

except Exception as e:
    print("ERROR:", e)
finally:
    db.close()
