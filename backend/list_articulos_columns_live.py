from database import engine
from sqlalchemy import text
import pandas as pd

q = """
SELECT TOP 1 *
FROM Articulos
WHERE CodigoEmpresa = 2
"""

try:
    with engine.connect() as conn:
        df = pd.read_sql(text(q), conn)
        print("Columns in Articulos table:")
        for col in df.columns:
            print(col)
except Exception as e:
    print(f"Error: {e}")
