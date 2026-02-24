from database import engine
from sqlalchemy import text
import pandas as pd

query = """
SELECT NumeroTrabajo, COUNT(DISTINCT EjercicioTrabajo) as YearCount
FROM OrdenesTrabajo
WHERE CodigoEmpresa = 2 AND EjercicioTrabajo IN (2025, 2026)
GROUP BY NumeroTrabajo
HAVING COUNT(DISTINCT EjercicioTrabajo) > 1
"""

with engine.connect() as conn:
    df = pd.read_sql(text(query), conn)
    print("Reused Work Numbers (2025 vs 2026):")
    print(df)
