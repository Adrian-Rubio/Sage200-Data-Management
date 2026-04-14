import pandas as pd
from sqlalchemy import text
from database import engine

def analyze():
    # January only, Company 2
    query_marg = "SELECT BaseImponible, ImporteCoste, NumeroFactura, CodigoArticulo, Comisionista FROM VIS_CEN_LinAlbFacSD WHERE CodigoEmpresa = '2' AND TRY_CONVERT(date, FechaFactura) >= '2026-01-01' AND TRY_CONVERT(date, FechaFactura) <= '2026-01-31'"
    query_rev = "SELECT BaseImponible, NumeroFactura, Comisionista FROM Vis_AEL_DiarioFactxComercial WHERE CodigoEmpresa = '2' AND TRY_CONVERT(date, FechaFactura) >= '2026-01-01' AND TRY_CONVERT(date, FechaFactura) <= '2026-01-31'"

    with engine.connect() as db:
        df_marg = pd.read_sql(text(query_marg), db)
        df_rev = pd.read_sql(text(query_rev), db)

    m_sum = float(df_marg['BaseImponible'].sum())
    m_cost = float(df_marg['ImporteCoste'].sum())
    m_margin = ((m_sum - m_cost) / m_sum * 100) if m_sum else 0

    r_sum = float(df_rev['BaseImponible'].sum())

    print(f'=== MARGIN VIEW (VIS_CEN_LinAlbFacSD) ===')
    print(f'Ventas Totales: {m_sum:,.2f}')
    print(f'Costes Totales: {m_cost:,.2f}')
    print(f'Margen Calculado: {m_margin:.2f}%\n')
    
    zero_cost = len(df_marg[df_marg['ImporteCoste'] == 0])
    null_cost = df_marg['ImporteCoste'].isna().sum()
    print(f'Lineas con coste 0: {zero_cost}')
    print(f'Lineas con coste nulo (NULL o NaN): {null_cost}')

    print(f'\n=== REVENUE VIEW (Vis_AEL_DiarioFactxComercial) ===')
    print(f'Ventas Totales: {r_sum:,.2f}')

    print(f'\nDiferencia de ventas (RevenueView - MarginView): {r_sum - m_sum:,.2f}')

    # Are there invoices in Rev that are not in Marg?
    inv_marg = set(df_marg['NumeroFactura'].unique())
    inv_rev = set(df_rev['NumeroFactura'].unique())
    
    missing_in_marg = inv_rev - inv_marg
    print(f'\nFacturas en Revenue pero no en Margin: {len(missing_in_marg)}')
    
    if len(missing_in_marg) > 0:
        missing_rev_amount = df_rev[df_rev['NumeroFactura'].isin(missing_in_marg)]['BaseImponible'].sum()
        print(f'Importe de esas facturas perdidas: {missing_rev_amount:,.2f}')

    # Let's see top differences by invoice
    rev_agg = df_rev.groupby('NumeroFactura')['BaseImponible'].sum().reset_index().rename(columns={'BaseImponible': 'RevAmount'})
    marg_agg = df_marg.groupby('NumeroFactura')['BaseImponible'].sum().reset_index().rename(columns={'BaseImponible': 'MargAmount'})
    
    merged = pd.merge(rev_agg, marg_agg, on='NumeroFactura', how='outer').fillna(0)
    merged['Diff'] = merged['RevAmount'] - merged['MargAmount']
    merged_diffs = merged[abs(merged['Diff']) > 0.01].sort_values(by='Diff', ascending=False)
    
    print(f'\nFacturas con discrepancias de valor (>0.01): {len(merged_diffs)}')
    if not merged_diffs.empty:
        print(merged_diffs.head(10).to_string(index=False))

if __name__ == '__main__':
    analyze()
