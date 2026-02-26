from sqlalchemy import text
from database import SessionLocal
import pandas as pd
from datetime import date

def test_kpi_discrepancy():
    db = SessionLocal()
    try:
        # Filters from screenshot: 2026-01-31 to 2026-02-27, Division: Conectrónica
        start_date = date(2026, 1, 31)
        end_date = date(2026, 2, 27)
        
        divisions = {
            'Conectrónica': ['JOSE CESPEDES BLANCO', 'ANTONIO MACHO MACHO', 'JESUS COLLADO ARAQUE', 'ADRIÁN ROMERO JIMENEZ'],
            'Sismecánica': ['JUAN CARLOS BENITO RAMOS', 'JAVIER ALLEN PERKINS'],
            'Informática Industrial': ['JUAN CARLOS VALDES ANTON']
        }
        
        reps = divisions['Conectrónica']
        placeholders = [f"'{r}'" for r in reps]
        
        where = f"WHERE CodigoEmpresa = '2' AND TRY_CONVERT(date, FechaFactura) >= :start_date AND TRY_CONVERT(date, FechaFactura) <= :end_date"
        where += f" AND UPPER(RTRIM(LTRIM(Comisionista))) IN ({', '.join(placeholders)})"
        
        params = {"start_date": start_date, "end_date": end_date}
        
        print("--- Querying Revenue (Vis_AEL_DiarioFactxComercial) ---")
        q_rev = f"SELECT Comisionista, SUM(BaseImponible) as Total FROM Vis_AEL_DiarioFactxComercial {where} GROUP BY Comisionista"
        df_rev = pd.read_sql(text(q_rev), db.bind, params=params)
        print(df_rev)
        print("Total Revenue:", df_rev['Total'].sum())
        
        print("\n--- Querying Margin (VIS_CEN_LinAlbFacSD) ---")
        q_marg = f"SELECT Comisionista, SUM(BaseImponible) as Total FROM VIS_CEN_LinAlbFacSD {where} GROUP BY Comisionista"
        df_marg = pd.read_sql(text(q_marg), db.bind, params=params)
        print(df_marg)
        print("Total Margin Data Sum:", df_marg['Total'].sum() if not df_marg.empty else 0)

    finally:
        db.close()

if __name__ == "__main__":
    test_kpi_discrepancy()
