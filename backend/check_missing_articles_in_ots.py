from database import engine
from sqlalchemy import text
import pandas as pd

# Check for ConsumosOT that don't have a matching article in Articulos table
query = """
SELECT TOP 20 
    c.NumeroTrabajo, 
    c.ArticuloComponente, 
    c.DescripcionLinea
FROM ConsumosOT c
LEFT JOIN Articulos a ON c.ArticuloComponente = a.CodigoArticulo AND c.CodigoEmpresa = a.CodigoEmpresa
WHERE c.CodigoEmpresa = 2 AND a.CodigoArticulo IS NULL
"""

try:
    with engine.connect() as conn:
        print("ConsumosOT records with NO matching Articulo:")
        df = pd.read_sql(text(query), conn)
        print(df.to_string())
except Exception as e:
    print(f"Error: {e}")
