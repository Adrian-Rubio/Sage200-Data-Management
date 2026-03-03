import os
import sys
sys.path.append(os.getcwd())

from database import engine
from sqlalchemy import text
import pandas as pd

def compare_logic():
    old_query = """
        SELECT 
            c.Comisionista as NombreComercial,
            SUM(p.BaseImponiblePendiente) as TotalPendiente
        FROM CEN_PowerBi_LineasPedVen_Vendedor p
        LEFT JOIN Comisionistas c ON p.CodigoComisionista = c.CodigoComisionista AND p.CodigoEmpresa = c.CodigoEmpresa
        WHERE p.UnidadesPendientes > 0
        AND p.CodigoEmpresa = '2'
        GROUP BY c.Comisionista
        ORDER BY TotalPendiente DESC
    """
    
    new_query = """
        SELECT 
            c.Comisionista as NombreComercial,
            SUM(p.BaseImponiblePendiente) as TotalPendiente
        FROM CEN_PowerBi_LineasPedVen_Vendedor p
        LEFT JOIN Comisionistas c ON p.CodigoComisionistaLinea = c.CodigoComisionista AND p.CodigoEmpresa = c.CodigoEmpresa
        WHERE p.UnidadesPendientes > 0
        AND p.CodigoEmpresa = '2'
        GROUP BY c.Comisionista
        ORDER BY TotalPendiente DESC
    """
    
    with engine.connect() as conn:
        print("=== OLD LOGIC (Header Sales Rep) ===")
        df_old = pd.read_sql(text(old_query), conn)
        df_old['NombreComercial'] = df_old['NombreComercial'].fillna('SIN COMERCIAL').str.strip().str.upper()
        print(df_old.to_string(index=False))
        
        print("\n=== NEW LOGIC (Line Sales Rep) ===")
        df_new = pd.read_sql(text(new_query), conn)
        df_new['NombreComercial'] = df_new['NombreComercial'].fillna('SIN COMERCIAL').str.strip().str.upper()
        print(df_new.to_string(index=False))

if __name__ == "__main__":
    compare_logic()
