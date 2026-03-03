import os
import sys
sys.path.append(os.getcwd())

from database import SessionLocal
from sqlalchemy import text
import pandas as pd

db = SessionLocal()

query_join = """
    SELECT 
        COUNT(*) as TotalRows,
        SUM(p.BaseImponiblePendiente) as TotalAmount
    FROM CEN_PowerBi_LineasPedVen_Vendedor p
    LEFT JOIN Comisionistas c ON p.CodigoComisionista = c.CodigoComisionista AND p.CodigoEmpresa = c.CodigoEmpresa
    WHERE p.UnidadesPendientes > 0
    AND p.CodigoEmpresa = '2'
"""

query_no_join = """
    SELECT 
        COUNT(*) as TotalRows,
        SUM(p.BaseImponiblePendiente) as TotalAmount
    FROM CEN_PowerBi_LineasPedVen_Vendedor p
    WHERE p.UnidadesPendientes > 0
    AND p.CodigoEmpresa = '2'
"""

try:
    df_join = pd.read_sql(text(query_join), db.bind)
    df_no_join = pd.read_sql(text(query_no_join), db.bind)
    
    print("WITH JOIN:")
    print(df_join)
    
    print("\nWITHOUT JOIN:")
    print(df_no_join)
    
except Exception as e:
    print("ERROR:", e)
finally:
    db.close()
