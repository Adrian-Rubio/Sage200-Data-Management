from sqlalchemy import text
from database import SessionLocal
import pandas as pd

def check_vis_cen():
    db = SessionLocal()
    try:
        print("--- Estructura de VIS_CEN_LinAlbFacSD ---")
        query = "SELECT TOP 1 * FROM VIS_CEN_LinAlbFacSD"
        df = pd.read_sql(text(query), db.bind)
        
        # Guardaremos las columnas para debuggear
        for col in df.columns:
            print(col)
            
        print("\n--- Muestra de Datos ---")
        print(df.head())
        
    finally:
        db.close()

if __name__ == "__main__":
    check_vis_cen()
