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

q("Work 496 in OrdenesTrabajo", "SELECT EjercicioTrabajo, NumeroTrabajo, CodigoEmpresa FROM OrdenesTrabajo WHERE NumeroTrabajo = 496 AND CodigoEmpresa = 2")
q("Work 496 in Incidencias", "SELECT EjercicioTrabajo, NumeroTrabajo, CodigoEmpresa, Operario FROM Incidencias WHERE NumeroTrabajo = 496")
q("Work 490 in Incidencias", "SELECT EjercicioTrabajo, NumeroTrabajo, CodigoEmpresa, Operario FROM Incidencias WHERE NumeroTrabajo = 490")
