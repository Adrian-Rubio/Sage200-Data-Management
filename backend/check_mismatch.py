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

# Search for the Fabrication numbers in the NumeroTrabajo field of Incidencias
# Just in case there is a mapping mismatch
q("Searching for Fab Num 20 in Incidencias (as work num)", "SELECT * FROM Incidencias WHERE NumeroTrabajo = 20 AND EjercicioTrabajo = 2026")
q("Searching for Fab Num 4886 in Incidencias (as work num)", "SELECT * FROM Incidencias WHERE NumeroTrabajo = 4886 AND EjercicioTrabajo = 2026")

# Check if there is a table specifically for INF or SIS series
q("Tables with 'INF' or 'SIS' in name", "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%INF%' OR TABLE_NAME LIKE '%SIS%'")
