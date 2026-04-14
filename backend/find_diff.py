import pandas as pd
from sqlalchemy import text
from database import engine

def analyze():
    query_marg = "SELECT BaseImponible, ImporteCoste, CodigoArticulo, CodigoFamilia, SerieFactura, Comisionista FROM VIS_CEN_LinAlbFacSD WHERE CodigoEmpresa = '2' AND TRY_CONVERT(date, FechaFactura) >= '2026-01-01' AND TRY_CONVERT(date, FechaFactura) <= '2026-01-31'"

    with engine.connect() as db:
        df = pd.read_sql(text(query_marg), db)

    total_cost = df['ImporteCoste'].sum()
    diff = total_cost - 475701.35
    print(f'Total Coste: {total_cost:,.2f}')
    print(f'Misterious Difference to find: {diff:,.2f}')

    print('\n--- Costes por SerieFactura ---')
    print(df.groupby('SerieFactura')['ImporteCoste'].sum().sort_values(ascending=False))

    print('\n--- Costes de Lineas con BaseImponible = 0 ---')
    print(df[df['BaseImponible'] == 0]['ImporteCoste'].sum())

    print('\n--- Costes de Lineas con BaseImponible < 0 ---')
    print(df[df['BaseImponible'] < 0]['ImporteCoste'].sum())
    
    print('\n--- Costes por Division (Comisionista in Dict) ---')
    # Divisions dictionary
    divisions = {
        'Conectrónica': ['JOSE CESPEDES BLANCO', 'ANTONIO MACHO MACHO', 'JESUS COLLADO ARAQUE', 'ADRIÁN ROMERO JIMENEZ'],
        'Sismecánica': ['JUAN CARLOS BENITO RAMOS', 'JAVIER ALLEN PERKINS'],
        'Informática Industrial': ['JUAN CARLOS VALDES ANTON']
    }
    
    # map division
    def get_div(rep):
        rep = str(rep).strip().upper()
        for k, v in divisions.items():
            if rep in [x.upper() for x in v]:
                return k
        return 'Otros'
        
    df['Division'] = df['Comisionista'].apply(get_div)
    print(df.groupby('Division')['ImporteCoste'].sum().sort_values(ascending=False))

if __name__ == '__main__':
    analyze()
