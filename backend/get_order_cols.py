import os
import sys
sys.path.append(os.getcwd())

from database import engine
from sqlalchemy import text
import pandas as pd

try:
    with engine.connect() as conn:
        df = pd.read_sql(text("SELECT TOP 1 * FROM CEN_PowerBi_LineasPedVen_Vendedor"), conn)
        print("Columnas de CEN_PowerBi_LineasPedVen_Vendedor:")
        for col in df.columns:
            print(f"- {col}")
        
        # Also let's check the date column to know if there's FechaPedido
except Exception as e:
    print(f"ERROR: {e}")
