import os
import sys
sys.path.append(os.getcwd())

from database import SessionLocal
from sqlalchemy import text
import pandas as pd

db = SessionLocal()

query_ex = """
    SELECT NumeroPedido, LineaPedido, UnidadesPendientes, PrecioCoste, PrecioVenta, BaseImponiblePendiente, BaseImponible, ImporteNetoPendiente, ImporteNeto
    FROM CEN_PowerBi_LineasPedVen_Vendedor
    WHERE CodigoEmpresa = '2' AND UnidadesPendientes > 0
    ORDER BY NumeroPedido
"""

try:
    df_ex = pd.read_sql(text(query_ex), db.bind)
    
    # Check orders with multiple lines
    multi_line_orders = df_ex['NumeroPedido'].value_counts()
    multi_line_orders = multi_line_orders[multi_line_orders > 1].index.tolist()
    
    if multi_line_orders:
        example_order = multi_line_orders[0]
        print(f"Example for multi-line order: {example_order}")
        print(df_ex[df_ex['NumeroPedido'] == example_order])
        
        # Check if BaseImponiblePendiente is same for all lines of the same order
        print("\nChecking if BaseImponiblePendiente is line-level or order-level...")
        same_base = df_ex.groupby('NumeroPedido')['BaseImponiblePendiente'].nunique()
        print(f"Orders where BaseImponiblePendiente varies across lines: {(same_base > 1).sum()} out of {len(same_base)}")
        
except Exception as e:
    print("ERROR:", e)
finally:
    db.close()
