import os
import sys
sys.path.append(os.getcwd())

from database import SessionLocal
from sqlalchemy import text
import pandas as pd

db = SessionLocal()

query_dups = """
    SELECT NumeroPedido, LineaPedido, COUNT(*) as NumApariciones
    FROM CEN_PowerBi_LineasPedVen_Vendedor
    WHERE CodigoEmpresa = '2'
    GROUP BY NumeroPedido, LineaPedido
    HAVING COUNT(*) > 1
"""

try:
    df_dups = pd.read_sql(text(query_dups), db.bind)
    print("Duplicated lines in View:")
    print(df_dups)
    if not df_dups.empty:
        # Check one example
        ejemplo_pedido = df_dups.iloc[0]['NumeroPedido']
        query_ex = f"""
            SELECT * FROM CEN_PowerBi_LineasPedVen_Vendedor
            WHERE CodigoEmpresa = '2' AND NumeroPedido = '{ejemplo_pedido}'
        """
        df_ex = pd.read_sql(text(query_ex), db.bind)
        print(f"\nExample for Pedido {ejemplo_pedido}:")
        print(df_ex[['NumeroPedido', 'LineaPedido', 'BaseImponiblePendiente', 'UnidadesPendientes', 'Comisionista']])
        
except Exception as e:
    print("ERROR:", e)
finally:
    db.close()
