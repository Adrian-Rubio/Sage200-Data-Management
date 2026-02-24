from database import engine
from sqlalchemy import text
import pandas as pd

query = """
    SELECT TOP 5
        ot.EjercicioTrabajo, ot.NumeroTrabajo,
        ofab.EjercicioFabricacion, ofab.SerieFabricacion, ofab.NumeroFabricacion,
        ot.CodigoArticulo,
        ot.Observaciones as Obs_OT,
        ofab.Observaciones as Obs_OFab,
        ofab.EstadoOF, ot.EstadoOT
    FROM OrdenesTrabajo ot
    LEFT JOIN OrdenesFabricacion ofab 
        ON ot.EjercicioFabricacion = ofab.EjercicioFabricacion
        AND ot.SerieFabricacion = ofab.SerieFabricacion
        AND ot.NumeroFabricacion = ofab.NumeroFabricacion
    WHERE ot.EjercicioTrabajo >= 2024
"""
try:
    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn)
        print("Muestra de JOIN OT - OFab:")
        print(df.to_string())
except Exception as e:
    print("Error SQL:")
    print(e)
