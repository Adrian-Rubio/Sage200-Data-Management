from database import engine
from sqlalchemy import text
import pandas as pd

q = """
SELECT NumeroTrabajo, ArticuloComponente, DescripcionLinea, UnidadesNecesarias
FROM ConsumosOT
WHERE ArticuloComponente = 'OM05487-000/002' AND CodigoEmpresa = 2
"""

try:
    with engine.connect() as conn:
        df = pd.read_sql(text(q), conn)
        print("OTs where OM05487-000/002 is ACTUALLY a component (by ArticuloComponente column):")
        print(df.to_string())
except Exception as e:
    print(f"Error: {e}")
