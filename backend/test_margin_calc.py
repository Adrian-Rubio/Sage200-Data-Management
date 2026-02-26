import sys
import pandas as pd
from sqlalchemy import text

sys.path.append(r"c:\Users\adrian.rubio\OneDrive - CENVAL S.L\Escritorio\repositorios\Data_Management\backend")
from database import engine

def main():
    try:
        with engine.connect() as conn:
            # Recreate the exact backend query
            query = "SELECT SUM(BaseImponible) as r, SUM(ImporteCoste) as c FROM CEN_PowerBI_LineasAlbaranesFacturadosSinDuplicados WHERE CodigoEmpresa <> '100' AND FechaFactura >= '2025-01-01'"
            df = pd.read_sql(text(query), conn)
            
            r = df['r'].iloc[0]
            c = df['c'].iloc[0]
            
            print(f"Revenue (r): {r} (type: {type(r)})")
            print(f"Cost (c): {c} (type: {type(c)})")
            
            if r is None:
                r = 0.0
            if c is None:
                c = 0.0
                
            total_revenue = float(r)
            total_cost = float(c)
            
            sales_margin = ((total_revenue - total_cost) / total_revenue * 100) if total_revenue > 0 else 0.0
            
            print(f"Sales Margin Calculated: {sales_margin}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
