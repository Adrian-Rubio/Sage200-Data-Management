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

# Check for a mapping between system users and operarios
q("Search for MDSMPRD002 in Usuarios", "SELECT * FROM Usuarios WHERE Nombre LIKE '%MDSMPRD002%' OR Usuario LIKE '%MDSMPRD002%'")

# Check if there's a field in Incidencias that I missed that might have a username
q("Examine 494 Incidencias including 'lsys' columns", """
SELECT Identificador, Operario, lsysUserInsert, lsysDateInsert, lsysUserUpdate, lsysDateUpdate
FROM Incidencias
WHERE NumeroTrabajo = 494 AND EjercicioTrabajo = 2026
""")

# Check if maybe the 'Operario' in Incidencias matches a column in some other table?
# Like 'CodigoEmpleado'?
q("Search for any Operario ID that is 0 but has a name in lsysUserInsert", """
SELECT DISTINCT lsysUserInsert 
FROM Incidencias 
WHERE Operario = 0 AND EjercicioTrabajo = 2026
""")
