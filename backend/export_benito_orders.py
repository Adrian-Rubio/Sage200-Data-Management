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
    AND UPPER(RTRIM(LTRIM(c.Comisionista))) = '{rep_name}'
"""

try:
    df = pd.read_sql(text(query), db.bind)
    if not df.empty:
        # Save to Excel
        output_path = r"C:\Users\adrian.rubio\OneDrive - CENVAL S.L\Escritorio\repositorios\Data_Management\Pedidos_Pendientes_Benito_Ramos.xlsx"
        df.to_excel(output_path, index=False)
        print(f"SUCCESS: File created at {output_path}")
        print(f"Rows exported: {len(df)}")
        print(f"Total Pending Amount in file: {df['BaseImponiblePendiente'].sum()}")
    else:
        print("ERROR: No data found for the specified filters.")
        
except Exception as e:
    print(f"ERROR: {e}")
finally:
    db.close()
