from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
import pandas as pd

router = APIRouter(
    prefix="/api/filters",
    tags=["filters"]
)

@router.get("/options")
def get_filter_options(db: Session = Depends(get_db)):
    try:
        # Get distinct Companies
        # Assuming Vis_AEL_DiarioFactxComercial has all companies we care about
        # Or we could query 'Empresas' table directly if preferred.
        # Let's stick to the view to ensure we only show options that have data.
        
        # Companies
        companies_query = "SELECT DISTINCT CodigoEmpresa FROM Vis_AEL_DiarioFactxComercial WHERE CodigoEmpresa <> '100' ORDER BY CodigoEmpresa"
        companies_df = pd.read_sql(text(companies_query), db.bind)
        
        company_mapping = {
            '2': 'CENVALSA INDUSTRIAL S.L.',
            '4': 'DUBES & MARCEN, S.L.',
            '5': 'EL BALCON DE DUBES&MARCEN',
            '6': 'SARATUR S.L.'
        }
        
        companies = []
        for _, row in companies_df.iterrows():
            cid = str(row['CodigoEmpresa'])
            name = company_mapping.get(cid, f"Empresa {cid}")
            companies.append({'id': cid, 'name': name})

        # Sales Reps (Filtered list)
        allowed_reps = [
            'JOSE CESPEDES BLANCO',
            'JUAN CARLOS BENITO RAMOS',
            'JUAN CARLOS VALDES ANTON',
            'ANTONIO MACHO MACHO',
            'JAVIER ALLEN PERKINS',
            'JESUS COLLADO ARAQUE'
        ]
        # We return these static names for now as they are the only ones requested.
        # In future we can query distinct Comisionista where name inside allowed_reps
        reps = [{'id': name, 'name': name} for name in allowed_reps]

        # Clients (Limit to top 100 or search? For now just return empty, frontend needs search)
        # Getting ALL clients might be too heavy (700+).
        # Let's return TOP 50 clients by revenue for the dropdown default
        clients_query = """
            SELECT TOP 50 CodigoCliente, MAX(RazonSocial) as RazonSocial, SUM(BaseImponible) as Total 
            FROM Vis_AEL_DiarioFactxComercial 
            GROUP BY CodigoCliente 
            ORDER BY Total DESC
        """
        clients_df = pd.read_sql(text(clients_query), db.bind)
        clients = [{'id': row['CodigoCliente'], 'name': row['RazonSocial']} for _, row in clients_df.iterrows()]
        
        # Series (Segmentations/Divisions)
        series_query = "SELECT DISTINCT SerieFactura FROM Vis_AEL_DiarioFactxComercial ORDER BY SerieFactura"
        series_df = pd.read_sql(text(series_query), db.bind)
        # Display as 'Serie 01', 'Serie 02', or just '01'
        series = [{'id': row['SerieFactura'], 'name': f"Serie {row['SerieFactura']}"} for _, row in series_df.iterrows()]

        return {
            "companies": companies,
            "reps": reps,
            "clients": clients,
            "series": series
        }

    except Exception as e:
        print(f"Error fetching filters: {e}")
        return {"companies": [], "reps": [], "clients": []}
