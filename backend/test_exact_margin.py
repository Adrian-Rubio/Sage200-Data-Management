from sqlalchemy import text
from database import SessionLocal
import pandas as pd

def test_exact_query():
    db = SessionLocal()
    try:
        divisions = {
            'Conectrónica': ['JOSE CESPEDES BLANCO', 'ANTONIO MACHO MACHO', 'JESUS COLLADO ARAQUE'],
            'Sismecánica': ['JUAN CARLOS BENITO RAMOS', 'JAVIER ALLEN PERKINS'],
            'Informática Industrial': ['JUAN CARLOS VALDES ANTON']
        }
        all_reps = [r for reps in divisions.values() for r in reps]
        
        start = '2026-01-31'
        end = '2026-02-27'
        company_filter = "CodigoEmpresa = '2'"
        
        common_where = ""
        common_params = {}
        placeholders = [f":rep_{i}" for i in range(len(all_reps))]
        common_where += f" AND UPPER(RTRIM(LTRIM(Comisionista))) IN ({', '.join(placeholders)})"
        for i, rep in enumerate(all_reps):
            common_params[f'rep_{i}'] = rep
            
        common_where += " AND TRY_CONVERT(date, FechaFactura) >= :start_date"
        common_params['start_date'] = start
        common_where += " AND TRY_CONVERT(date, FechaFactura) <= :end_date"
        common_params['end_date'] = end

        query_marg = f"SELECT * FROM VIS_CEN_LinAlbFacSD WHERE {company_filter} {common_where}"
        print("Query:", query_marg)
        df_marg = pd.read_sql(text(query_marg), db.bind, params=common_params)
        print("Rows fetched:", len(df_marg))
        if not df_marg.empty:
            print("Margin Sum:", df_marg['BaseImponible'].sum())
            
    finally:
        db.close()

if __name__ == '__main__':
    test_exact_query()
