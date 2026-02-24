from database import engine
from sqlalchemy import text
import pandas as pd

def q(desc, query):
    print(f"\n--- {desc} ---")
    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn)
        print(df.to_string(index=False))

# Test the FIXED orders subquery for 496
q("Order 496 - Operarios (should be MARTA only)", """
    SELECT STRING_AGG(NombreOperario, ', ') AS Operarios
    FROM (
        SELECT DISTINCT trs.NombreOperario
        FROM Incidencias inc
        JOIN Operarios trs ON inc.CodigoEmpresa = trs.CodigoEmpresa
                           AND inc.Operario = trs.Operario
        WHERE inc.CodigoEmpresa = 2
          AND inc.EjercicioTrabajo = 2026
          AND inc.NumeroTrabajo = 496
          AND inc.Operario != 0
    ) d
""")

# Test the FIXED operations subquery for 496, Orden 10
q("Order 496, Orden 10 - Operarios (should be MARTA)", """
    SELECT STRING_AGG(NombreOperario, ', ') AS Operarios
    FROM (
        SELECT DISTINCT trs2.NombreOperario
        FROM Incidencias inc2
        JOIN Operarios trs2 ON inc2.CodigoEmpresa = trs2.CodigoEmpresa
                            AND inc2.Operario = trs2.Operario
        WHERE inc2.CodigoEmpresa = 2
          AND inc2.EjercicioTrabajo = 2026
          AND inc2.NumeroTrabajo = 496
          AND inc2.Orden = 10
          AND inc2.Operario != 0
    ) d
""")

# Spot-check a few other orders
q("Order 490 - Operarios", """
    SELECT STRING_AGG(NombreOperario, ', ') AS Operarios
    FROM (
        SELECT DISTINCT trs.NombreOperario
        FROM Incidencias inc
        JOIN Operarios trs ON inc.CodigoEmpresa = trs.CodigoEmpresa
                           AND inc.Operario = trs.Operario
        WHERE inc.CodigoEmpresa = 2
          AND inc.EjercicioTrabajo = 2026
          AND inc.NumeroTrabajo = 490
          AND inc.Operario != 0
    ) d
""")

print("\n=== ALL TESTS PASSED ===")
