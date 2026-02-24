from database import engine
from sqlalchemy import text
import pandas as pd

def q(desc, query):
    print(f"\n--- {desc} ---")
    try:
        with engine.connect() as conn:
            df = pd.read_sql(text(query), conn)
            print(df.to_string(index=False))
    except Exception as e:
        print(f"ERROR: {e}")

# Check 494 in the breakdown table
q("Breakdown for 494 (IncidenciasOperariosDesglose)", """
SELECT iod.EjercicioTrabajo, iod.NumeroTrabajo, iod.Orden, iod.Operario, trs.NombreOperario
FROM IncidenciasOperariosDesglose iod
LEFT JOIN Operarios trs ON iod.CodigoEmpresa = trs.CodigoEmpresa AND iod.Operario = trs.Operario
WHERE iod.NumeroTrabajo = 494 AND iod.EjercicioTrabajo = 2026
""")

# Check 492 in the breakdown table
q("Breakdown for 492 (IncidenciasOperariosDesglose)", """
SELECT iod.EjercicioTrabajo, iod.NumeroTrabajo, iod.Orden, iod.Operario, trs.NombreOperario
FROM IncidenciasOperariosDesglose iod
LEFT JOIN Operarios trs ON iod.CodigoEmpresa = trs.CodigoEmpresa AND iod.Operario = trs.Operario
WHERE iod.NumeroTrabajo = 492 AND iod.EjercicioTrabajo = 2026
""")
