import pandas as pd
from sqlalchemy import text
from database import engine

def analyze():
    query_marg = "SELECT BaseImponible, ImporteCoste, CodigoArticulo, CodigoFamilia, RazonSocial FROM VIS_CEN_LinAlbFacSD WHERE CodigoEmpresa = '2' AND TRY_CONVERT(date, FechaFactura) >= '2026-01-01' AND TRY_CONVERT(date, FechaFactura) <= '2026-01-31'"

    with engine.connect() as db:
        df = pd.read_sql(text(query_marg), db)

    total_cost = df['ImporteCoste'].sum()
    print(f'Total Coste: {total_cost:,.2f}')

    # Group by Familia
    print('\n--- Costes por Familia ---')
    fam_group = df.groupby('CodigoFamilia')['ImporteCoste'].sum().sort_values(ascending=False).head(20)
    print(fam_group.to_string())

    # Are there specific Articles with very high costs that make up the difference?
    print('\n--- Top 20 Articulos por Coste ---')
    art_group = df.groupby('CodigoArticulo')['ImporteCoste'].sum().sort_values(ascending=False).head(20)
    print(art_group.to_string())

if __name__ == '__main__':
    analyze()
