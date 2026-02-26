from database import engine
from sqlalchemy import text
import pandas as pd

def check_margin_data():
    query = "SELECT TOP 100 BaseImponible, ImporteCoste, CodigoArticulo, RazonSocial FROM CEN_PowerBI_LineasAlbaranesFacturadosSinDuplicados WHERE CodigoEmpresa <> '100'"
    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn)
        print("--- First 100 rows of margin data ---")
        print(df.head(10).to_string(index=False))
        
        print("\n--- Summary Statistics ---")
        print(df[['BaseImponible', 'ImporteCoste']].describe())
        
        # Check for zero costs
        zero_costs = df[df['ImporteCoste'] == 0].shape[0]
        print(f"\nRows with zero ImporteCoste: {zero_costs} out of {df.shape[0]}")
        
        # Calculate overall margin for these 100 rows
        total_rev = df['BaseImponible'].sum()
        total_cost = df['ImporteCoste'].sum()
        if total_rev > 0:
            margin = (total_rev - total_cost) / total_rev * 100
            print(f"\nCalculated Margin for these rows: {margin:.2f}%")
        else:
            print("\nTotal revenue is 0, cannot calculate margin.")

if __name__ == "__main__":
    check_margin_data()
