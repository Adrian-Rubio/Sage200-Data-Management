import sys
import pandas as pd
from sqlalchemy import text
from database import SessionLocal

def test():
    db = SessionLocal()
    try:
        company_filter = "CodigoEmpresa = '2'"
        common_where = " AND FechaFactura >= :start_date AND FechaFactura <= :end_date"
        query_marg = f"SELECT * FROM VIS_CEN_LinAlbFacSD WHERE {company_filter} {common_where}"
        params = {'start_date': '2025-02-01', 'end_date': '2025-03-31'}
        
        print("Query:", query_marg)
        df_marg = pd.read_sql(text(query_marg), db.bind, params=params)
        print("Rows fetched:", len(df_marg))
        if not df_marg.empty:
            print(df_marg[['FechaFactura', 'BaseImponible', 'ImporteCoste', 'Comisionista']].head())
    except Exception as e:
        print("Error:", e)
    finally:
        db.close()

if __name__ == '__main__':
    test()
