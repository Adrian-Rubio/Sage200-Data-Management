from database import engine
from sqlalchemy import text
import pandas as pd

q = """
SELECT TOP 1 *
FROM ConsumosOT
WHERE NumeroTrabajo = 773 AND EjercicioTrabajo = 2026 AND CodigoEmpresa = 2 AND Orden = 10
"""

try:
    with engine.connect() as conn:
        df = pd.read_sql(text(q), conn)
        for col in df.columns:
            val = df[col].iloc[0]
            if str(val) == 'OEMIC-NE011/000':
                print(f"BINGO! Column '{col}' contains 'OEMIC-NE011/000'")
            else:
                print(f"{col}: {val}")
except Exception as e:
    print(f"Error: {e}")
