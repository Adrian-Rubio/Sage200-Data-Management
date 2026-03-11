from database import engine
from sqlalchemy import text
import pandas as pd

query = """
SELECT NumeroTrabajo, EjercicioTrabajo, EstadoOT, UnidadesAFabricar, UnidadesFabricadas, CodigoArticulo, DescripcionArticulo
FROM OrdenesTrabajo
WHERE NumeroTrabajo IN (3962, 3915, 2073, 2420) AND CodigoEmpresa = 2
"""

try:
    df = pd.read_sql(text(query), engine)
    print("Specific OTs:")
    print(df)
except Exception as e:
    print(f"Error: {e}")
