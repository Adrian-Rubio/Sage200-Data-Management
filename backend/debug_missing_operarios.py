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
            return df
    except Exception as e:
        print(f"ERROR: {e}")
        return None

# Find finished orders that have NO operarios according to our CURRENT query logic
q("Finished orders with NO operarios (Current Logic)", """
SELECT TOP 20
  ot.NumeroTrabajo, ot.SerieFabricacion, ot.NumeroFabricacion, ot.EstadoOT,
  (SELECT COUNT(*) FROM Incidencias inc WHERE inc.EjercicioTrabajo = ot.EjercicioTrabajo AND inc.NumeroTrabajo = ot.NumeroTrabajo AND inc.Operario != 0) as RawIncCount,
  (SELECT COUNT(*) FROM Incidencias inc 
   JOIN Operarios trs ON inc.CodigoEmpresa = trs.CodigoEmpresa AND inc.Operario = trs.Operario
   WHERE inc.CodigoEmpresa = ot.CodigoEmpresa -- THIS MIGHT BE THE PROBLEM
     AND inc.EjercicioTrabajo = ot.EjercicioTrabajo 
     AND inc.NumeroTrabajo = ot.NumeroTrabajo 
     AND inc.Operario != 0) as CurrentLogicIncCount
FROM OrdenesTrabajo ot
WHERE ot.CodigoEmpresa = 2 AND ot.EjercicioTrabajo = 2026 AND ot.EstadoOT = 2
ORDER BY ot.NumeroTrabajo DESC
""")

# Check Incidencias for one of those orders to see their CodigoEmpresa
q("Incidencias detail for a 'missing' order (example work 489)", """
SELECT TOP 10
  inc.CodigoEmpresa as IncEmp, inc.EjercicioTrabajo, inc.NumeroTrabajo, inc.Orden, inc.Operario,
  op.CodigoEmpresa as OpEmp
FROM Incidencias inc
LEFT JOIN OperacionesOT op ON inc.EjercicioTrabajo = op.EjercicioTrabajo AND inc.NumeroTrabajo = op.NumeroTrabajo AND inc.Orden = op.Orden
WHERE inc.EjercicioTrabajo = 2026 AND inc.NumeroTrabajo = 489
""")
