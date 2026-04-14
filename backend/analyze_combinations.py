import pandas as pd
from sqlalchemy import text
from database import engine

def analyze():
    query_marg = "SELECT BaseImponible, ImporteCoste, CodigoArticulo, CodigoFamilia FROM VIS_CEN_LinAlbFacSD WHERE CodigoEmpresa = '2' AND TRY_CONVERT(date, FechaFactura) >= '2026-01-01' AND TRY_CONVERT(date, FechaFactura) <= '2026-01-31'"
    
    with engine.connect() as db:
        df = pd.read_sql(text(query_marg), db)

    total_cost = df['ImporteCoste'].sum()
    total_sales = df['BaseImponible'].sum()
    
    print(f'Sales: {total_sales:,.2f}')
    print(f'Cost: {total_cost:,.2f}\n')

    # Exclude certain families to see if we get exactly 475k
    for fam in df['CodigoFamilia'].unique():
        cost_without_fam = df[df['CodigoFamilia'] != fam]['ImporteCoste'].sum()
        sales_without_fam = df[df['CodigoFamilia'] != fam]['BaseImponible'].sum()
        print(f'Cost without {fam}: {cost_without_fam:,.2f}')

    # Try different combinations
    # ...

if __name__ == '__main__':
    analyze()
