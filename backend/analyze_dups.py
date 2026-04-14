import pandas as pd
from sqlalchemy import text
from database import engine

def analyze():
    query_marg = "SELECT BaseImponible, ImporteCoste, NumeroFactura, NumeroAlbaran, CodigoArticulo, Orden, IDFila FROM VIS_CEN_LinAlbFacSD WHERE CodigoEmpresa = '2' AND TRY_CONVERT(date, FechaFactura) >= '2026-01-01' AND TRY_CONVERT(date, FechaFactura) <= '2026-01-31'"

    with engine.connect() as db:
        df = pd.read_sql(text(query_marg), db)

    total_cost = df['ImporteCoste'].sum()
    print(f'Total Coste Inicial: {total_cost:,.2f}')

    # Check for duplicated rows exactly
    dups = df.duplicated()
    print(f'Exact duplicate rows: {dups.sum()}')
    if dups.sum() > 0:
        cost_dups = df[dups]['ImporteCoste'].sum()
        print(f'Total Coste in duplicate rows: {cost_dups:,.2f}')

    # Check for duplicate IDFila
    id_dups = df.duplicated(subset=['IDFila'])
    print(f'Duplicate IDFila: {id_dups.sum()}')
    if id_dups.sum() > 0:
        cost_id_dups = df[id_dups]['ImporteCoste'].sum()
        print(f'Total Coste in duplicate IDFila: {cost_id_dups:,.2f}')

    # Check for duplicates without IDFila (NumeroAlbaran, Linea, Articulo)
    semidups = df.duplicated(subset=['NumeroAlbaran', 'Orden', 'CodigoArticulo'], keep=False)
    print(f'Duplicate Albaran+Orden+Articulo: {semidups.sum()}')
    if semidups.sum() > 0:
        cost_semi = df[semidups]['ImporteCoste'].sum()
        print(f'Total Coste in those dups: {cost_semi:,.2f}')
        
        # let's see some of them
        print(df[semidups].sort_values(['NumeroAlbaran', 'Orden']).head(10).to_string(index=False))

if __name__ == '__main__':
    analyze()
