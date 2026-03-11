from database import engine
from sqlalchemy import text
import pandas as pd

query = """
SELECT 
    EjercicioTrabajo,
    COUNT(*) as TotalStatus3
FROM OrdenesTrabajo 
WHERE CodigoEmpresa = 2 AND EstadoOT = 3
GROUP BY EjercicioTrabajo
ORDER BY EjercicioTrabajo DESC
"""

try:
    with engine.connect() as conn:
        print("OTs in Status 3 (Retenida) by Exercise:")
        df = pd.read_sql(text(query), conn)
        print(df.to_string())
except Exception as e:
    print(f"Error: {e}")
