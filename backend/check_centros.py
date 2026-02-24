from database import engine
from sqlalchemy import text
import pandas as pd

def q(desc, query):
    print(f"\n--- {desc} ---")
    try:
        with engine.connect() as conn:
            df = pd.read_sql(text(query), conn)
            print(df.to_string(index=False))
    except Exception as e:
        print(f"ERROR: {e}")

# Check CentrosTrabajo
q("Centros de Trabajo", "SELECT TOP 20 * FROM CentrosTrabajo")

# check if 494 incidencias have a CentroTrabajo
q("494 Incidencias with CentroTrabajo", """
SELECT inc.NumeroTrabajo, inc.Orden, inc.Operario, inc.CentroTrabajo, ct.Nombre as NombreCentro
FROM Incidencias inc
LEFT JOIN CentrosTrabajo ct ON inc.CodigoEmpresa = ct.CodigoEmpresa AND inc.CentroTrabajo = ct.CentroTrabajo
WHERE inc.NumeroTrabajo = 494 AND inc.EjercicioTrabajo = 2026
""")
