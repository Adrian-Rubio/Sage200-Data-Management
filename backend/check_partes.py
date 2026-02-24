from database import engine
from sqlalchemy import text
import pandas as pd

def q(desc, query):
    print(f"\n--- {desc} ---")
    try:
        with engine.connect() as conn:
            df = pd.read_sql(text(query), conn)
            print(f"Rows: {len(df)}")
            print(df.head(20).to_string(index=False))
            return df
    except Exception as e:
        print(f"ERROR: {e}")
        return None

# Check LcLineasParteImputaciones for work related info
q("Sample LcLineasParteImputaciones", "SELECT TOP 20 * FROM LcLineasParteImputaciones")

# Check if we can find 494 in Partes tables
# Note: Partes usually use Exercise/Series/Number for the Parte itself, 
# but they might have a field for the WO (Work Order) they belong to.
q("Search LcCabeceraParte for anything Feb 2026", """
SELECT TOP 20 * 
FROM LcCabeceraParte 
WHERE Fecha >= '2026-02-01'
""")

# Check for a specific link between WO and Partes
q("Search for 494 in ANY column of LcCabeceraParte", """
SELECT * FROM LcCabeceraParte WHERE NumeroParteLc = 494 OR NumeroSerieLc = '494'
""")

# Check LcLineasParteImputaciones for NumeroTrabajo or similar
q("Columns in LcLineasParteImputaciones", "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'LcLineasParteImputaciones'")
