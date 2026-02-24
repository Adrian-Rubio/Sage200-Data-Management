from database import engine
from sqlalchemy import text
import pandas as pd

def q(desc, query):
    print(f"\n--- {desc} ---")
    try:
        with engine.connect() as conn:
            df = pd.read_sql(text(query), conn)
            print(f"Rows: {len(df)}")
            print(df.to_string(index=False))
    except Exception as e:
        print(f"ERROR: {e}")

# Check if NumeroTrabajo is unique in OrdenesTrabajo
q("Duplicate NumeroTrabajo in OrdenesTrabajo (2026, Empresa 2)", """
SELECT NumeroTrabajo, COUNT(*) as cnt
FROM OrdenesTrabajo
WHERE EjercicioTrabajo = 2026 AND CodigoEmpresa = 2
GROUP BY NumeroTrabajo
HAVING COUNT(*) > 1
""")

# Check the specific 496 order
q("Order 496 Detailed", """
SELECT CodigoEmpresa, EjercicioTrabajo, NumeroTrabajo, SerieFabricacion, NumeroFabricacion, CodigoArticulo
FROM OrdenesTrabajo
WHERE EjercicioTrabajo = 2026 AND NumeroTrabajo = 496
""")

# Check Operations for 496
q("Operations for 496 Detailed", """
SELECT CodigoEmpresa, EjercicioTrabajo, NumeroTrabajo, Orden, CodigoArticulo, DescripcionOperacion
FROM OperacionesOT
WHERE EjercicioTrabajo = 2026 AND NumeroTrabajo = 496
""")

q("Verify CodigoEmpresa in OperacionesOT", """
SELECT DISTINCT CodigoEmpresa FROM OperacionesOT WHERE EjercicioTrabajo = 2026 AND NumeroTrabajo = 496
""")
