from sqlalchemy import text
from database import SessionLocal
import pandas as pd
from datetime import date

def replicate_sales_logic():
    db = SessionLocal()
    try:
        # Exact filters from screenshot
        start_date = date(2026, 1, 31)
        end_date = date(2026, 2, 27)
        division = "Conectrónica"
        
        divisions = {
            'Conectrónica': ['JOSE CESPEDES BLANCO', 'ANTONIO MACHO MACHO', 'JESUS COLLADO ARAQUE', 'ADRIÁN ROMERO JIMENEZ'],
            'Sismecánica': ['JUAN CARLOS BENITO RAMOS', 'JAVIER ALLEN PERKINS'],
            'Informática Industrial': ['JUAN CARLOS VALDES ANTON']
        }
        
        current_allowed_reps = divisions[division]
        
        common_where = ""
        common_params = {'start_date': start_date, 'end_date': end_date}
        
        placeholders = [f":rep_{i}" for i in range(len(current_allowed_reps))]
        common_where += f" AND UPPER(RTRIM(LTRIM(Comisionista))) IN ({', '.join(placeholders)})"
        for i, rep in enumerate(current_allowed_reps):
            common_params[f'rep_{i}'] = rep
            
        common_where += " AND TRY_CONVERT(date, FechaFactura) >= :start_date"
        common_where += " AND TRY_CONVERT(date, FechaFactura) <= :end_date"
        
        company_filter = "CodigoEmpresa = '2'"
        
        # --- QUERY 1 ---
        query_rev = f"SELECT * FROM Vis_AEL_DiarioFactxComercial WHERE {company_filter} {common_where}"
        df_rev = pd.read_sql(text(query_rev), db.bind, params=common_params)
        
        print(f"df_rev rows: {len(df_rev)}")
        if not df_rev.empty:
            print(f"df_rev sum: {df_rev['BaseImponible'].sum()}")
            print("Revenue by Rep:")
            print(df_rev.groupby('Comisionista')['BaseImponible'].sum())
            
        # --- QUERY 2 ---
        query_marg = f"SELECT * FROM VIS_CEN_LinAlbFacSD WHERE {company_filter} {common_where}"
        df_marg = pd.read_sql(text(query_marg), db.bind, params=common_params)
        
        print(f"\ndf_marg rows: {len(df_marg)}")
        if not df_marg.empty:
            print(f"df_marg sum: {df_marg['BaseImponible'].sum()}")
            print("Margin Sum by Rep:")
            print(df_marg.groupby('Comisionista')['BaseImponible'].sum())

    finally:
        db.close()

if __name__ == "__main__":
    replicate_sales_logic()
