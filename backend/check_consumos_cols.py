from database import engine
from sqlalchemy import text
import pandas as pd

q = """
SELECT TOP 1 *
FROM ConsumosOT
WHERE NumeroTrabajo = 773 AND EjercicioTrabajo = 2026 AND CodigoEmpresa = 2
"""

try:
    with engine.connect() as conn:
        df = pd.read_sql(text(q), conn)
        print("Columns and first row of ConsumosOT:")
        for col in df.columns:
            print(f"{col}: {df[col].iloc[0]}")
except Exception as e:
    print(f"Error: {e}")
