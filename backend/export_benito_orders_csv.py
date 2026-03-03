import os
import sys
sys.path.append(os.getcwd())

from database import SessionLocal
from sqlalchemy import text
import pandas as pd

db = SessionLocal()

# Target Rep Name
rep_name = "JUAN CARLOS BENITO RAMOS"

query = f"""
    SELECT p.*, c.Comisionista as NombreComercial
    FROM CEN_PowerBi_LineasPedVen_Vendedor p
    LEFT JOIN Comisionistas c ON p.CodigoComisionista = c.CodigoComisionista AND p.CodigoEmpresa = c.CodigoEmpresa
    WHERE p.UnidadesPendientes > 0
    AND p.CodigoEmpresa = '2'
"""

try:
    df = pd.read_sql(text(query), db.bind)
    
    # Filter by rep in python to be safer with names
    df['NombreComercial'] = df['NombreComercial'].str.strip().str.upper()
    df_benito = df[df['NombreComercial'] == rep_name].copy()
    
    if not df_benito.empty:
        # Save to CSV
        output_path = r"C:\Users\adrian.rubio\OneDrive - CENVAL S.L\Escritorio\repositorios\Data_Management\Pedidos_Pendientes_Benito_Ramos.csv"
        df_benito.to_csv(output_path, index=False, sep=';', encoding='latin-1')
        print(f"SUCCESS: File created at {output_path}")
        print(f"Rows exported: {len(df_benito)}")
        total_amt = df_benito['BaseImponiblePendiente'].sum()
        print(f"Total Pending Amount in file: {total_amt}")
    else:
        print("ERROR: No data found for specified rep name.")
        
except Exception as e:
    print(f"ERROR: {e}")
finally:
    db.close()
