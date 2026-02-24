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
    except Exception as e:
        print(f"ERROR: {e}")

# Search for any non-zero operario for 494 in ANY company
q("Global Search for 494 Incidencias", """
SELECT CodigoEmpresa, EjercicioTrabajo, NumeroTrabajo, Orden, Operario, DescripcionOperacion
FROM Incidencias
WHERE NumeroTrabajo = 494
  AND Operario != 0
""")

# Search for any non-zero operario for 492 in ANY company
q("Global Search for 492 Incidencias", """
SELECT CodigoEmpresa, EjercicioTrabajo, NumeroTrabajo, Orden, Operario, DescripcionOperacion
FROM Incidencias
WHERE NumeroTrabajo = 492
  AND Operario != 0
""")

# check 496 again to compare
q("Global Search for 496 Incidencias", """
SELECT CodigoEmpresa, EjercicioTrabajo, NumeroTrabajo, Orden, Operario, DescripcionOperacion
FROM Incidencias
WHERE NumeroTrabajo = 496
  AND Operario != 0
""")
