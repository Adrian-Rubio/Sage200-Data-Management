from sqlalchemy import text
from database import get_db
import pandas as pd

def check_adrian_romero():
    db = next(get_db())
    try:
        # Search in Diario
        query_diario = "SELECT DISTINCT Comisionista FROM Vis_AEL_DiarioFactxComercial WHERE Comisionista LIKE :name"
        df_diario = pd.read_sql(text(query_diario), db.bind, params={"name": "%ADRIAN%ROMERO%"})
        print("Matches in Vis_AEL_DiarioFactxComercial:")
        print(df_diario)
        
        # Search in Margin View
        query_marg = "SELECT DISTINCT Comisionista FROM VIS_CEN_LinAlbFacSD WHERE Comisionista LIKE :name"
        df_marg = pd.read_sql(text(query_marg), db.bind, params={"name": "%ADRIAN%ROMERO%"})
        print("\nMatches in VIS_CEN_LinAlbFacSD:")
        print(df_marg)
        
        # Check if he has sales data
        query_sales = "SELECT COUNT(*) as count, SUM(BaseImponible) as total FROM Vis_AEL_DiarioFactxComercial WHERE Comisionista LIKE :name"
        df_sales = pd.read_sql(text(query_sales), db.bind, params={"name": "%ADRIAN%ROMERO%"})
        print("\nSales summary for ADRIAN ROMERO:")
        print(df_sales)

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_adrian_romero()
