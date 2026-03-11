from database import SessionLocal
import pandas as pd
from sqlalchemy import text

db = SessionLocal()

query = """
    SELECT 
        m.ArticuloComponente as code, 
        m.DescripcionLinea as description, 
        COUNT(DISTINCT m.NumeroTrabajo) as ot_count
    FROM ConsumosOT m
    JOIN OrdenesTrabajo ot ON m.CodigoEmpresa = ot.CodigoEmpresa AND m.EjercicioTrabajo = ot.EjercicioTrabajo AND m.NumeroTrabajo = ot.NumeroTrabajo
    WHERE ot.CodigoEmpresa = 2 
      AND (ot.EstadoOT < 2 OR (m.UnidadesNecesarias - m.UnidadesUsadas) > 0)
    GROUP BY m.ArticuloComponente, m.DescripcionLinea
    ORDER BY ot_count DESC
"""

try:
    print("Executing query...")
    df = pd.read_sql(text(query), db.bind)
    print(f"Success! Found {len(df)} articles.")
    print(df.head(5).to_string())
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
