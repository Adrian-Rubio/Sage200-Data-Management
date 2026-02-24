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

# Check columns in OperacionesOT
q("Columns in OperacionesOT", """
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'OperacionesOT'
""")

# Check if we can find work 496 by Serie/Numero Fabricacion
q("Find by Serie/Numero Fabricacion", """
SELECT EjercicioTrabajo, NumeroTrabajo, Orden
FROM OperacionesOT
WHERE EjercicioFabricacion = 2026 AND SerieFabricacion = 'CON' AND NumeroFabricacion = 3593
""")
