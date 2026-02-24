from database import engine
from sqlalchemy import text
import pandas as pd

def q(desc, query):
    print(f"\n--- {desc} ---")
    try:
        with engine.connect() as conn:
            df = pd.read_sql(text(query), conn)
            print(df.to_string())
    except Exception as e:
        print(f"ERROR: {e}")

# Check columns for breakdown tables
q("Columns in IncidenciasOperariosDesglose", "SELECT TOP 0 * FROM IncidenciasOperariosDesglose")
q("Columns in IncidenciasEmpleado", "SELECT TOP 0 * FROM IncidenciasEmpleado")

# Check if 494 has records in these tables via some link
# First find the Identificador for 494 incidencias
print("\n--- Identificadores for 494 (Ejercicio 2026) ---")
with engine.connect() as conn:
    identificadores = pd.read_sql(text("SELECT Identificador, Orden FROM Incidencias WHERE NumeroTrabajo = 494 AND EjercicioTrabajo = 2026"), conn)
    print(identificadores)

if not identificadores.empty:
    ids = [f"'{x}'" for x in identificadores['Identificador'].tolist()]
    ids_str = ",".join(ids)
    q("Search in IncidenciasOperariosDesglose for 494 IDs", f"SELECT * FROM IncidenciasOperariosDesglose WHERE Identificador IN ({ids_str})")
    q("Search in IncidenciasEmpleado for 494 IDs", f"SELECT * FROM IncidenciasEmpleado WHERE Identificador IN ({ids_str})")
