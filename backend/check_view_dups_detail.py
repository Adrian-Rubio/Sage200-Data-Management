import os
import sys
sys.path.append(os.getcwd())

from database import SessionLocal
from sqlalchemy import text
import pandas as pd

db = SessionLocal()

query_ex = """
    SELECT * FROM CEN_PowerBi_LineasPedVen_Vendedor
    WHERE CodigoEmpresa = '2' AND NumeroPedido = '3' AND LineaPedido = 10
"""

try:
    df_ex = pd.read_sql(text(query_ex), db.bind)
    print("Example for Pedido 3, Line 10:")
    pd.set_option('display.max_columns', None)
    print(df_ex)
    
except Exception as e:
    print("ERROR:", e)
finally:
    db.close()
