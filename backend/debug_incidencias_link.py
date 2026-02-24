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

# Check if there are incidencias linked via Serie/Numero Fabricacion instead of NumeroTrabajo
q("Search Incidencias by Fabrication Number (for work 575/Fab 4931)", """
SELECT inc.* 
FROM Incidencias inc
WHERE inc.EjercicioFabricacion = 2026 AND inc.SerieFabricacion = 'SIS' AND inc.NumeroFabricacion = 4931
""")

# Check for finished orders where Incidencias exist but Operario join fails
q("Check for join failures in finished orders (Empresa matches)", """
SELECT TOP 10
    inc.NumeroTrabajo, inc.Operario, inc.CodigoEmpresa as IncEmp,
    (SELECT TOP 1 CodigoEmpresa FROM Operarios WHERE Operario = inc.Operario) as OpTableEmp
FROM Incidencias inc
WHERE inc.EjercicioTrabajo = 2026 AND inc.NumeroTrabajo IN (SELECT NumeroTrabajo FROM OrdenesTrabajo WHERE EstadoOT = 2)
  AND NOT EXISTS (SELECT 1 FROM Operarios trs WHERE inc.CodigoEmpresa = trs.CodigoEmpresa AND inc.Operario = trs.Operario)
""")
