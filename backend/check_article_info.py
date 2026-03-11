from database import engine
from sqlalchemy import text
import pandas as pd

q = """
SELECT CodigoArticulo, DescripcionArticulo, Descripcion2Articulo
FROM Articulos
WHERE CodigoArticulo = 'OM05487-000/002' AND CodigoEmpresa = 2
"""

try:
    with engine.connect() as conn:
        df = pd.read_sql(text(q), conn)
        print("Article info from Articulos table:")
        print(df.to_string())
except Exception as e:
    print(f"Error: {e}")
