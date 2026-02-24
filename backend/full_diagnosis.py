from database import engine
from sqlalchemy import text
import pandas as pd

def q(desc, query):
    print(f"\n{'='*80}")
    print(f"  {desc}")
    print(f"{'='*80}")
    try:
        with engine.connect() as conn:
            df = pd.read_sql(text(query), conn)
            print(f"Rows: {len(df)}")
            if not df.empty:
                pd.set_option('display.max_columns', None)
                pd.set_option('display.width', 200)
                print(df.to_string(index=False))
            return df
    except Exception as e:
        print(f"ERROR: {e}")
        return None

# =========================================================================
# 1. SCHEMA: Key columns in each table (Empresa 2 only)
# =========================================================================

q("Incidencias - Key Columns (types)", """
    SELECT COLUMN_NAME, DATA_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Incidencias'
    AND COLUMN_NAME IN ('CodigoEmpresa','EjercicioTrabajo','NumeroTrabajo','Identificador',
                        'Orden','Operacion','Operario','CentroTrabajo','Fecha','DescripcionOperacion')
    ORDER BY ORDINAL_POSITION
""")

q("OperacionesOT - Key Columns (types)", """
    SELECT COLUMN_NAME, DATA_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'OperacionesOT'
    AND COLUMN_NAME IN ('CodigoEmpresa','EjercicioTrabajo','NumeroTrabajo','Orden',
                        'Operacion','CodigoArticulo','DescripcionOperacion','EstadoOperacion',
                        'NumeroFabricacion','SerieFabricacion')
""")

q("OrdenesTrabajo - Key Columns (types)", """
    SELECT COLUMN_NAME, DATA_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'OrdenesTrabajo'
    AND COLUMN_NAME IN ('CodigoEmpresa','EjercicioTrabajo','NumeroTrabajo',
                        'NumeroFabricacion','SerieFabricacion','CodigoArticulo',
                        'DescripcionArticulo','EstadoOT','EjercicioFabricacion')
""")

q("Operarios - Key Columns (types)", """
    SELECT COLUMN_NAME, DATA_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Operarios'
    AND COLUMN_NAME IN ('CodigoEmpresa','Operario','NombreOperario')
""")

# =========================================================================
# 2. DATA: Operarios in Empresa 2
# =========================================================================

q("All Operarios in Empresa 2", """
    SELECT Operario, NombreOperario 
    FROM Operarios 
    WHERE CodigoEmpresa = 2
    ORDER BY Operario
""")

# =========================================================================
# 3. DIAGNOSIS: Order 496 (was working, now broken)
# =========================================================================

q("OrdenesTrabajo for 496 (Empresa 2)", """
    SELECT NumeroTrabajo, EjercicioTrabajo, SerieFabricacion, NumeroFabricacion, 
           CodigoArticulo, EstadoOT
    FROM OrdenesTrabajo 
    WHERE NumeroTrabajo = 496 AND CodigoEmpresa = 2
""")

q("Incidencias for 496 in Empresa 2 (ALL)", """
    SELECT NumeroTrabajo, EjercicioTrabajo, Orden, Operario, Operacion, 
           DescripcionOperacion, Fecha
    FROM Incidencias 
    WHERE NumeroTrabajo = 496 AND CodigoEmpresa = 2
    ORDER BY EjercicioTrabajo, Orden
""")

q("OperacionesOT for 496 (Empresa 2, 2026)", """
    SELECT NumeroTrabajo, EjercicioTrabajo, Orden, Operacion, 
           DescripcionOperacion, EstadoOperacion
    FROM OperacionesOT 
    WHERE NumeroTrabajo = 496 AND CodigoEmpresa = 2 AND EjercicioTrabajo = 2026
    ORDER BY Orden
""")

# Does OperacionesOT have NumeroFabricacion?
q("Does OperacionesOT have NumeroFabricacion?", """
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'OperacionesOT' AND COLUMN_NAME LIKE '%Fabricacion%'
""")

# =========================================================================
# 4. DIAGNOSIS: Order 492 (SIS series, missing operarios)
# =========================================================================

q("OrdenesTrabajo for 492 (Empresa 2)", """
    SELECT NumeroTrabajo, EjercicioTrabajo, SerieFabricacion, NumeroFabricacion, 
           CodigoArticulo, EstadoOT
    FROM OrdenesTrabajo 
    WHERE NumeroTrabajo = 492 AND CodigoEmpresa = 2
""")

q("Incidencias for 492 in Empresa 2 (ALL)", """
    SELECT NumeroTrabajo, EjercicioTrabajo, Orden, Operario, Operacion, 
           DescripcionOperacion, Fecha
    FROM Incidencias 
    WHERE NumeroTrabajo = 492 AND CodigoEmpresa = 2
    ORDER BY EjercicioTrabajo, Orden
""")

# =========================================================================
# 5. TEST: The ORIGINAL simple query that USED to work for 496
# =========================================================================

q("ORIGINAL LOGIC test for 496 (simple match)", """
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

# =========================================================================
# 6. TEST: The CURRENT broken query for 496
# =========================================================================

q("CURRENT LOGIC test for 496 (cross-company, dual match)", """
    SELECT STRING_AGG(NombreOperario, ', ') AS Operarios
    FROM (
        SELECT DISTINCT trs.NombreOperario
        FROM Incidencias inc
        JOIN (
            SELECT DISTINCT Operario, NombreOperario 
            FROM Operarios 
        ) trs ON inc.Operario = trs.Operario
        WHERE (
                (inc.NumeroTrabajo = 496 AND inc.EjercicioTrabajo = 2026)
                OR
                (inc.NumeroTrabajo = 3593 AND inc.EjercicioTrabajo = 2026)
            )
          AND inc.Operario != 0
    ) d
""")

# =========================================================================
# 7. Check if Operario ID uniqueness is a problem across companies
# =========================================================================

q("Operario ID 3 across ALL companies", """
    SELECT CodigoEmpresa, Operario, NombreOperario 
    FROM Operarios 
    WHERE Operario = 3
""")

# =========================================================================
# 8. Count of orders with/without operarios using ORIGINAL logic
# =========================================================================

q("Count of 2026 Empresa 2 orders WITH operarios (original simple logic)", """
    SELECT COUNT(DISTINCT ot.NumeroTrabajo) as OrdersWithOperarios
    FROM OrdenesTrabajo ot
    WHERE ot.CodigoEmpresa = 2 AND ot.EjercicioTrabajo = 2026
      AND EXISTS (
          SELECT 1 FROM Incidencias inc
          WHERE inc.CodigoEmpresa = 2
            AND inc.EjercicioTrabajo = ot.EjercicioTrabajo
            AND inc.NumeroTrabajo = ot.NumeroTrabajo
            AND inc.Operario != 0
      )
""")

q("Total 2026 Empresa 2 orders", """
    SELECT COUNT(*) as TotalOrders
    FROM OrdenesTrabajo ot
    WHERE ot.CodigoEmpresa = 2 AND ot.EjercicioTrabajo = 2026
""")

print("\n\nDONE.")
