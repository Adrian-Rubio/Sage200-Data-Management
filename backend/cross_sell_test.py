import pandas as pd
from sqlalchemy import text
from database import SessionLocal

# Map divisions
divisions = {
    'Conectrónica': ['JOSE CESPEDES BLANCO', 'ANTONIO MACHO MACHO', 'JESUS COLLADO ARAQUE', 'ADRIÁN ROMERO JIMENEZ'],
    'Sismecánica': ['JUAN CARLOS BENITO RAMOS', 'JAVIER ALLEN PERKINS'],
    'Informática Industrial': ['JUAN CARLOS VALDES ANTON']
}

# Create reverse map
rep_to_div = {}
for div, reps in divisions.items():
    for rep in reps:
        rep_to_div[rep.upper()] = div

def analyze_cross_sell():
    db = SessionLocal()
    try:
        # Get all sales from Company 2
        query = """
            SELECT CodigoCliente, RazonSocial, Comisionista, SUM(BaseImponible) as TotalBase
            FROM Vis_AEL_DiarioFactxComercial
            WHERE CodigoEmpresa = '2'
            GROUP BY CodigoCliente, RazonSocial, Comisionista
        """
        df = pd.read_sql(text(query), db.bind)
        
        if df.empty:
            print("No data found for Empresa 2")
            return
            
        df['Comisionista'] = df['Comisionista'].str.strip().str.upper()
        df['Division'] = df['Comisionista'].map(rep_to_div).fillna('Otros')
        
        # Filter out 'Otros'
        df = df[df['Division'] != 'Otros']
        
        # Group by client and get unique divisions
        client_divs = df.groupby(['CodigoCliente', 'RazonSocial'])['Division'].unique().reset_index()
        client_divs['NumDivisions'] = client_divs['Division'].apply(len)
        
        total_clients = len(client_divs)
        cross_sell_clients = client_divs[client_divs['NumDivisions'] > 1]
        
        print(f"Total clients in Empresa 2 (with known divisions): {total_clients}")
        print(f"Clients buying from multiple divisions: {len(cross_sell_clients)}")
        print(f"Cross-sell percentage: {len(cross_sell_clients) / total_clients * 100:.2f}%\n")
        
        print("Breakdown of cross-selling combinations:")
        combinations = cross_sell_clients['Division'].apply(lambda x: " + ".join(sorted(x))).value_counts()
        for comb, count in combinations.items():
            print(f"- {comb}: {count} clients ({count / total_clients * 100:.2f}% of total)")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    analyze_cross_sell()
