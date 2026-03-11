from database import engine
from sqlalchemy import text
import pandas as pd

q = """
SELECT Orden, CodigoArticulo, DescripcionLinea, UnidadesNecesarias
FROM ConsumosOT
WHERE NumeroTrabajo = 773 AND EjercicioTrabajo = 2026 AND CodigoEmpresa = 2
ORDER BY Orden
"""

try:
    with engine.connect() as conn:
        df = pd.read_sql(text(q), conn)
        print("Components of OT 773/2026:")
        for _, row in df.iterrows():
            print(f"Order: {row['Orden']}, Code: {row['CodigoArticulo']}, Desc: {row['DescripcionLinea']}, Qty: {row['UnidadesNecesarias']}")
except Exception as e:
    print(f"Error: {e}")
