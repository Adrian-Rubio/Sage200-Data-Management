from database import engine
from sqlalchemy import text
import pandas as pd

q = """
SELECT CodigoArticulo, DescripcionArticulo
FROM Articulos
WHERE DescripcionArticulo LIKE 'PC Fanless Intel 12%' AND CodigoEmpresa = 2
"""

try:
    with engine.connect() as conn:
        df = pd.read_sql(text(q), conn)
        print("Search result for 'PC Fanless Intel 12%':")
        print(df.to_string())
except Exception as e:
    print(f"Error: {e}")
