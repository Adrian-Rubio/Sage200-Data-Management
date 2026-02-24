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

# Check these specific orders that we know have operarios in the query
q("Status of orders with known operarios (207, 218, 345, 418)", """
SELECT NumeroTrabajo, EjercicioTrabajo, EstadoOT, CodigoArticulo
FROM OrdenesTrabajo
WHERE NumeroTrabajo IN (207, 218, 345, 418) AND CodigoEmpresa = 2
""")

# Compare with the orders from the screenshot (494, 492, 493)
q("Status of 'missing' orders (494, 492, 493)", """
SELECT NumeroTrabajo, EjercicioTrabajo, EstadoOT, CodigoArticulo, SerieFabricacion
FROM OrdenesTrabajo
WHERE NumeroTrabajo IN (494, 492, 493) AND CodigoEmpresa = 2
""")

# Find what's unique about 496 (which works)
q("Incidencias for 496 (The Working One)", """
SELECT inc.EjercicioTrabajo, inc.NumeroTrabajo, inc.Orden, inc.Operario, trs.NombreOperario
FROM Incidencias inc
JOIN Operarios trs ON inc.CodigoEmpresa = trs.CodigoEmpresa AND inc.Operario = trs.Operario
WHERE inc.NumeroTrabajo = 496 AND inc.EjercicioTrabajo = 2026
""")
