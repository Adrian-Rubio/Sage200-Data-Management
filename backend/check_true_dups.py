import os
import sys
sys.path.append(os.getcwd())

from database import SessionLocal
from sqlalchemy import text
import pandas as pd

db = SessionLocal()

query_truedups = """
    SELECT NumeroPedido, LineaPedido, 
           BaseImponiblePendiente, 
           UnidadesPendientes,
           Comisionista,
           COUNT(*) as Apariciones
    FROM CEN_PowerBi_LineasPedVen_Vendedor
    WHERE CodigoEmpresa = '2' AND UnidadesPendientes > 0
    GROUP BY NumeroPedido, LineaPedido, BaseImponiblePendiente, UnidadesPendientes, Comisionista
    HAVING COUNT(*) > 1
"""

try:
    df_truedups = pd.read_sql(text(query_truedups), db.bind)
    print("True Duplicates for Pending Lines:")
    print(df_truedups)
    
    if not df_truedups.empty:
        # Calculate total duplicated amount
        # If a line appears N times, we overcount by N-1 times its BaseImponiblePendiente
        total_overcount = ((df_truedups['Apariciones'] - 1) * df_truedups['BaseImponiblePendiente']).sum()
        print(f"\nTOTAL OVERCOUNT DUE TO DUPLICATES: {total_overcount} EUR")
        
except Exception as e:
    print("ERROR:", e)
finally:
    db.close()
