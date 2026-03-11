from database import SessionLocal
import pandas as pd
from sqlalchemy import text

db = SessionLocal()

query = """
    SELECT 
        MAT_TAB.ArticuloComponente as code, 
        MAT_TAB.DescripcionLinea as description, 
        COUNT(DISTINCT MAT_TAB.NumeroTrabajo) as ot_count
    FROM ConsumosOT MAT_TAB
    JOIN OrdenesTrabajo OT_TAB ON MAT_TAB.CodigoEmpresa = OT_TAB.CodigoEmpresa AND MAT_TAB.EjercicioTrabajo = OT_TAB.EjercicioTrabajo AND MAT_TAB.NumeroTrabajo = OT_TAB.NumeroTrabajo
    WHERE OT_TAB.CodigoEmpresa = 2 
      AND (OT_TAB.EstadoOT < 2 OR (MAT_TAB.UnidadesNecesarias - MAT_TAB.UnidadesUsadas) > 0)
    GROUP BY MAT_TAB.ArticuloComponente, MAT_TAB.DescripcionLinea
"""

try:
    print("Executing query with longer aliases...")
    df = pd.read_sql(text(query), db.bind)
    print(f"Success! Found {len(df)} articles.")
    print(df.head(5).to_string())
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
