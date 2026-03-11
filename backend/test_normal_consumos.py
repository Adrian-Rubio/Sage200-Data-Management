from database import engine
from sqlalchemy import text
import pandas as pd

q = """
SELECT TOP 20 c.NumeroTrabajo, c.CodigoArticulo, c.UnidadesNecesarias
FROM ConsumosOT c
JOIN OrdenesTrabajo ot ON c.CodigoEmpresa = ot.CodigoEmpresa AND c.EjercicioTrabajo = ot.EjercicioTrabajo AND c.NumeroTrabajo = ot.NumeroTrabajo
WHERE ot.CodigoArticulo <> c.CodigoArticulo AND ot.CodigoEmpresa = 2 AND ot.EjercicioTrabajo = 2026
"""

try:
    with engine.connect() as conn:
        df = pd.read_sql(text(q), conn)
        print("OTs where component code is DIFFERENT from main article code:")
        print(df.to_string())
except Exception as e:
    print(f"Error: {e}")
