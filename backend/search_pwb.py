from database import engine
from sqlalchemy import text
import pandas as pd

def q(desc, query):
    print(f"\n--- {desc} ---")
    try:
        with engine.connect() as conn:
            df = pd.read_sql(text(query), conn)
            print(f"Rows: {len(df)}")
            print(df.to_string(index=False))
    except Exception as e:
        print(f"ERROR: {e}")

# Find any table with 'NumeroFabricacion' or 'SerieFabricacion'
q("Tables with Fabrication columns", """
SELECT DISTINCT TABLE_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE COLUMN_NAME IN ('NumeroFabricacion', 'SerieFabricacion')
""")

# Search for DAVID (Operario 10) in ANY table in 2026
# Suppose Operario 10 is David. Let's see where he appears in 2026.
# Check pwb_Partes, pwb_OperarioOperacion, etc.
q("Search for Operario 10 (DAVID) in pwb tables", """
SELECT 'pwb_Operarios' as src, COUNT(*) as cnt FROM pwb_Operarios WHERE Operario = 10
UNION ALL
SELECT 'pwb_Partes' as src, COUNT(*) as cnt FROM pwb_Partes WHERE Operario = 10
UNION ALL
SELECT 'pwb_OperarioOperacion' as src, COUNT(*) as cnt FROM pwb_OperarioOperacion WHERE Operario = 10
""")

# Check for any record of work 494 or 492 in 'pwb' tables
q("Search for 494/492 in pwb_Partes", """
SELECT * FROM pwb_Partes WHERE NumeroTrabajo IN (494, 492)
""")
