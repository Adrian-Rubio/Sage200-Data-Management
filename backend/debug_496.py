from database import engine
from sqlalchemy import text
import pandas as pd

def q(desc, query, params=None):
    print(f"\n--- {desc} ---")
    try:
        with engine.connect() as conn:
            df = pd.read_sql(text(query), conn, params=params)
            print(f"Rows: {len(df)}")
            print(df.to_string(index=False))
            return df
    except Exception as e:
        print(f"ERROR: {e}")
        return None

# Check the specific order the user is seeing
q("Specific Order: 2026 / CON / 3593", """
SELECT CodigoEmpresa, EjercicioTrabajo, NumeroTrabajo, SerieFabricacion, NumeroFabricacion, CodigoArticulo, EstadoOT
FROM OrdenesTrabajo
WHERE EjercicioTrabajo = 2026 AND SerieFabricacion = 'CON' AND NumeroFabricacion = 3593
""")

# Check operations for that work order across ALL companies
q("Operations for Work 496 (All Companies)", """
SELECT CodigoEmpresa, EjercicioTrabajo, NumeroTrabajo, Orden, CodigoArticulo, DescripcionOperacion
FROM OperacionesOT
WHERE EjercicioTrabajo = 2026 AND NumeroTrabajo = 496
""")

# Check total companies in OperacionesOT for 2026
q("Companies per table (Summary)", """
SELECT 'OrdenesTrabajo' as T, CodigoEmpresa, COUNT(*) as cnt FROM OrdenesTrabajo WHERE EjercicioTrabajo = 2026 GROUP BY CodigoEmpresa
UNION ALL
SELECT 'OperacionesOT', CodigoEmpresa, COUNT(*) FROM OperacionesOT WHERE EjercicioTrabajo = 2026 GROUP BY CodigoEmpresa
""")
