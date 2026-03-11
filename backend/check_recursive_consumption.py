from database import engine
from sqlalchemy import text
import pandas as pd

# Check for OTs where an article is both the parent and its own component
query = """
SELECT 
    c.NumeroTrabajo, 
    c.EjercicioTrabajo, 
    c.ArticuloComponente, 
    ot.CodigoArticulo as ArticleParent
FROM ConsumosOT c
JOIN OrdenesTrabajo ot ON c.CodigoEmpresa = ot.CodigoEmpresa AND c.EjercicioTrabajo = ot.EjercicioTrabajo AND c.NumeroTrabajo = ot.NumeroTrabajo
WHERE c.CodigoEmpresa = 2 AND c.ArticuloComponente = ot.CodigoArticulo
"""

try:
    with engine.connect() as conn:
        print("OTs with Recursive Consumption (Self-consumption):")
        df = pd.read_sql(text(query), conn)
        print(df.to_string())
except Exception as e:
    print(f"Error: {e}")
