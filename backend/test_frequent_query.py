from database import engine
from sqlalchemy import text
import pandas as pd

query = """
SELECT TOP 10 
    m.CodigoArticulo as code, 
    a.DescripcionArticulo as description,
    COUNT(*) as movement_count
FROM MovimientoStock m
JOIN Articulos a ON m.CodigoEmpresa = a.CodigoEmpresa AND m.CodigoArticulo = a.CodigoArticulo
WHERE m.CodigoEmpresa = 2 
  AND m.Fecha >= DATEADD(day, -30, GETDATE())
GROUP BY m.CodigoArticulo, a.DescripcionArticulo
ORDER BY movement_count DESC
"""

try:
    df = pd.read_sql(text(query), engine)
    print("Top articles by movement (last 30 days):")
    print(df)
except Exception as e:
    print(f"Error: {e}")
