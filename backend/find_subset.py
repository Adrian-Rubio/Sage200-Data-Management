import pandas as pd
from sqlalchemy import text
from database import engine

def analyze():
    query = """
    SELECT 
        NumeroFactura, CodigoArticulo, ImporteCoste, BaseImponible
    FROM VIS_CEN_LinAlbFacSD
    WHERE CodigoEmpresa = '2' 
      AND TRY_CONVERT(date, FechaFactura) >= '2026-01-01' 
      AND TRY_CONVERT(date, FechaFactura) <= '2026-01-31'
    """
    with engine.connect() as db:
        df = pd.read_sql(text(query), db)

    total_cost = df['ImporteCoste'].sum()
    print(f'Total cost check: {total_cost}')
    diff = total_cost - 475701.35
    print(f'Diff: {diff}')

if __name__ == '__main__':
    analyze()
