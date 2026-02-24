from database import engine
from sqlalchemy import text
import pandas as pd

def q(desc, query):
    print(f"\n--- {desc} ---")
    try:
        with engine.connect() as conn:
            df = pd.read_sql(text(query), conn)
            print(f"Total Rows: {len(df)}")
            if len(df) > 0:
                print(df.head(20).to_string(index=False))
            return df
    except Exception as e:
        print(f"ERROR: {e}")
        return None

# Check 494 (from screenshot)
q("Incidencias for 494 (Broad Search)", """
SELECT inc.EjercicioTrabajo, inc.NumeroTrabajo, inc.Orden, inc.Operario, inc.Fecha, trs.NombreOperario, inc.CodigoEmpresa
FROM Incidencias inc
LEFT JOIN Operarios trs ON inc.CodigoEmpresa = trs.CodigoEmpresa AND inc.Operario = trs.Operario
WHERE inc.NumeroTrabajo = 494
""")

# Check 492 (from screenshot)
q("Incidencias for 492 (Broad Search)", """
SELECT inc.EjercicioTrabajo, inc.NumeroTrabajo, inc.Orden, inc.Operario, inc.Fecha, trs.NombreOperario, inc.CodigoEmpresa
FROM Incidencias inc
LEFT JOIN Operarios trs ON inc.CodigoEmpresa = trs.CodigoEmpresa AND inc.Operario = trs.Operario
WHERE inc.NumeroTrabajo = 492
""")

# Check if there are operarios in OperacionesOT directly? (Highly unlikely but worth a look at values)
q("Sample OperacionesOT for 494", "SELECT * FROM OperacionesOT WHERE NumeroTrabajo = 494 AND EjercicioTrabajo = 2026")

# Check if maybe they are linked by a different field?
q("Search for ANY record with work 494 in other tables", """
SELECT 'IncidenciasEmpleado' as source, COUNT(*) as cnt FROM IncidenciasEmpleado WHERE NumeroTrabajo = 494
UNION ALL
SELECT 'IncidenciasOperariosDesglose' as source, COUNT(*) as cnt FROM IncidenciasOperariosDesglose WHERE NumeroTrabajo = 494
""")
