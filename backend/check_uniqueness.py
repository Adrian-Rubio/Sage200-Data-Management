from database import engine
from sqlalchemy import text
import pandas as pd

query = """
SELECT NumeroTrabajo, EjercicioTrabajo, COUNT(DISTINCT SerieFabricacion) as SerieCount 
FROM OrdenesTrabajo 
WHERE CodigoEmpresa = 2 
GROUP BY NumeroTrabajo, EjercicioTrabajo 
HAVING COUNT(DISTINCT SerieFabricacion) > 1
"""

with engine.connect() as conn:
    df = pd.read_sql(text(query), conn)
    print("Duplicates of NumeroTrabajo in same Ejercicio with different Series:")
    print(df)
