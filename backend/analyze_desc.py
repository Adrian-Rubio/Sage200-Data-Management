import pandas as pd
from sqlalchemy import text
from database import engine

def analyze():
    query = """
    SELECT 
        v.CodigoArticulo, 
        a.DescripcionArticulo,
        v.CodigoFamilia, 
        SUM(v.BaseImponible) as Ventas, 
        SUM(v.ImporteCoste) as Costes,
        SUM(v.BaseImponible - v.ImporteCoste) as Margen
    FROM VIS_CEN_LinAlbFacSD v
    LEFT JOIN Articulos a ON v.CodigoArticulo = a.CodigoArticulo AND v.CodigoEmpresa = a.CodigoEmpresa
    WHERE v.CodigoEmpresa = '2' 
      AND TRY_CONVERT(date, v.FechaFactura) >= '2026-01-01' 
      AND TRY_CONVERT(date, v.FechaFactura) <= '2026-01-31'
    GROUP BY v.CodigoArticulo, a.DescripcionArticulo, v.CodigoFamilia
    ORDER BY Costes DESC
    """
    with engine.connect() as db:
        df = pd.read_sql(text(query), db)
    
    print('Top 20 items by Cost:')
    print(df.head(20).to_string(index=False))
    
    # Are there any items where Cost > Sales significantly?
    df_neg_margin = df[df['Costes'] > df['Ventas']]
    diff_neg_margin = df_neg_margin['Costes'].sum() - df_neg_margin['Ventas'].sum()
    print(f'\nTotal Cost of items where Cost > Sales: {df_neg_margin["Costes"].sum():,.2f}')
    print(f'Total Sales of those items: {df_neg_margin["Ventas"].sum():,.2f}')
    print(f'Loss (Cost - Sales): {diff_neg_margin:,.2f}')
    print(df_neg_margin.sort_values(by='Costes', ascending=False).head(20).to_string(index=False))

if __name__ == '__main__':
    analyze()
