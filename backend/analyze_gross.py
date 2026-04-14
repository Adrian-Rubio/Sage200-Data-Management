import pandas as pd
from sqlalchemy import text
from database import engine

def analyze():
    query_marg = "SELECT BaseImponible, ImporteCoste, NumeroFactura, NumeroAlbaran FROM VIS_CEN_LinAlbFacSD WHERE CodigoEmpresa = '2' AND TRY_CONVERT(date, FechaFactura) >= '2026-01-01' AND TRY_CONVERT(date, FechaFactura) <= '2026-01-31'"
    query_rev = "SELECT BaseImponible, NumeroFactura FROM Vis_AEL_DiarioFactxComercial WHERE CodigoEmpresa = '2' AND TRY_CONVERT(date, FechaFactura) >= '2026-01-01' AND TRY_CONVERT(date, FechaFactura) <= '2026-01-31'"
    
    with engine.connect() as db:
        df_marg = pd.read_sql(text(query_marg), db)
        df_rev = pd.read_sql(text(query_rev), db)

    sales_pos = df_marg[df_marg['BaseImponible'] > 0]['BaseImponible'].sum()
    sales_neg = df_marg[df_marg['BaseImponible'] < 0]['BaseImponible'].sum()
    cost_pos = df_marg[df_marg['ImporteCoste'] > 0]['ImporteCoste'].sum()
    cost_neg = df_marg[df_marg['ImporteCoste'] < 0]['ImporteCoste'].sum()
    
    print(f'-- MARGIN VIEW (`VIS_CEN_LinAlbFacSD`) --')
    print(f'Pos Sales: {sales_pos:,.2f}')
    print(f'Neg Sales: {sales_neg:,.2f}')
    print(f'Net Sales: {sales_pos + sales_neg:,.2f}')
    print(f'Pos Cost: {cost_pos:,.2f}')
    print(f'Neg Cost: {cost_neg:,.2f}')
    print(f'Net Cost: {cost_pos + cost_neg:,.2f}\n')

    rev_pos = df_rev[df_rev['BaseImponible'] > 0]['BaseImponible'].sum()
    rev_neg = df_rev[df_rev['BaseImponible'] < 0]['BaseImponible'].sum()
    print(f'-- REVENUE VIEW (`Vis_AEL_DiarioFactxComercial`) --')
    print(f'Pos Sales (Gross): {rev_pos:,.2f}')
    print(f'Neg Sales (Abonos): {rev_neg:,.2f}')
    print(f'Net Sales: {rev_pos + rev_neg:,.2f}')

if __name__ == '__main__':
    analyze()
