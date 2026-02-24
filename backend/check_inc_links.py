from database import engine
from sqlalchemy import text
import pandas as pd

def q(query):
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)

print("--- Link between WO and Incidencias for 494 ---")
# Check DocumentoEnlazado and other potential link fields
print(q("SELECT NumeroTrabajo, Orden, Operario, DocumentoEnlazado, IncidenciasTipoRegistrosEmpresa, Identificador FROM Incidencias WHERE NumeroTrabajo = 494").to_string(index=False))

print("\n--- Link Check for 496 ---")
print(q("SELECT NumeroTrabajo, Orden, Operario, DocumentoEnlazado, Identificador FROM Incidencias WHERE NumeroTrabajo = 496").to_string(index=False))
