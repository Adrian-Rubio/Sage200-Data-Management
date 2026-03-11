from database import engine
from sqlalchemy import text
import pandas as pd

# Find OTs in status 1 (Open/In Course) but with 0 or negative balance
query = """
SELECT NumeroTrabajo, EjercicioTrabajo, CodigoArticulo, UnidadesAFabricar, UnidadesFabricadas, EstadoOT
FROM OrdenesTrabajo
WHERE CodigoEmpresa = 2 AND EstadoOT = 1 AND (UnidadesAFabricar - UnidadesFabricadas) <= 0
"""

try:
    with engine.connect() as conn:
        print("OTs in Status 1 (Open) but with NO Pending Balance:")
        df = pd.read_sql(text(query), conn)
        print(df.to_string())
except Exception as e:
    print(f"Error: {e}")
