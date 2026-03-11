from database import engine
from sqlalchemy import text
import pandas as pd

query = """
SELECT TOP 20 
    c.CodigoArticulo, 
    c.DescripcionArticulo, 
    c.UnidadesNecesarias, 
    c.UnidadesUsadas,
    ot.EstadoOT,
    c.NumeroTrabajo
FROM ConsumosOT c
JOIN OrdenesTrabajo ot ON c.CodigoEmpresa = ot.CodigoEmpresa 
                  AND c.EjercicioTrabajo = ot.EjercicioTrabajo 
                  AND c.NumeroTrabajo = ot.NumeroTrabajo
WHERE c.CodigoEmpresa = 2 
  AND ot.EstadoOT IN (0, 1)
  AND (c.UnidadesNecesarias - c.UnidadesUsadas) > 0
"""

try:
    df = pd.read_sql(text(query), engine)
    print("Components from ConsumosOT for active OTs:")
    print(df)
except Exception as e:
    print(f"Error: {e}")
