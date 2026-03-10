
import pandas as pd
from database import engine
from sqlalchemy import text

q = 'LATIGUILLO'
query = """
    SELECT TOP 10 
        CodigoArticulo as code, 
        DescripcionArticulo as description,
        UnidadMedida1_ as unit
    FROM Articulos
    WHERE CodigoEmpresa = 2 
      AND (CodigoArticulo LIKE :q OR DescripcionArticulo LIKE :q)
"""

try:
    df = pd.read_sql(text(query), engine, params={"q": f"%{q}%"})
    print("SUCCESS")
    print(df.to_dict(orient='records'))
except Exception as e:
    print(f"FAILED: {e}")
