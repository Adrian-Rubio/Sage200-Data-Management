import sys
import pandas as pd
from sqlalchemy import text

sys.path.append(r"c:\Users\adrian.rubio\OneDrive - CENVAL S.L\Escritorio\repositorios\Data_Management\backend")
from database import engine

def main():
    try:
        with engine.connect() as conn:
            q1 = "SELECT SUM(BaseImponible) as total1 FROM Vis_AEL_DiarioFactxComercial WHERE CodigoEmpresa <> '100' AND FechaFactura >= '2025-01-01'"
            df1 = pd.read_sql(text(q1), conn)
            
            q2 = "SELECT SUM(BaseImponible) as total2, SUM(ImporteCoste) as cost FROM CEN_PowerBI_LineasAlbaranesFacturadosSinDuplicados WHERE CodigoEmpresa <> '100' AND FechaFactura >= '2025-01-01'"
            df2 = pd.read_sql(text(q2), conn)
            
            print(f"Total from Vis_AEL_DiarioFactxComercial: {df1['total1'].iloc[0]}")
            print(f"Total from CEN_PowerBI_LineasAlbaranesFacturadosSinDuplicados: {df2['total2'].iloc[0]}")
            print(f"Total Cost from CEN_PVBI...: {df2['cost'].iloc[0]}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
