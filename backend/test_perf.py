from database import engine
from sqlalchemy import text
import pandas as pd
import time

query = """
    SELECT 
        ot.EjercicioTrabajo as Ejercicio,
        ot.NumeroTrabajo,
        ot.SerieFabricacion as SerieDocumento,
        ot.NumeroFabricacion,
        ot.PeriodoFabricacion as Periodo,
        ot.CodigoArticulo, ot.DescripcionArticulo,
        ot.UnidadesAFabricar as UnidadesFabricar, ot.UnidadesFabricadas, ot.EstadoOT as EstadoOF,
        ot.FechaCreacion, ot.FechaFinalPrevista,
        ofab.Observaciones as Observaciones, 
        (
            SELECT STRING_AGG(NombreOperario, ', ')
            FROM (
                SELECT DISTINCT trs.NombreOperario
                FROM Incidencias inc
                JOIN Operarios trs ON inc.CodigoEmpresa = trs.CodigoEmpresa
                                  AND inc.Operario = trs.Operario
                WHERE inc.CodigoEmpresa = ot.CodigoEmpresa
                  AND inc.EjercicioTrabajo = ot.EjercicioTrabajo
                  AND inc.NumeroTrabajo = ot.NumeroTrabajo
                  AND inc.Operario != 0
            ) d
        ) AS Operarios
    FROM OrdenesTrabajo ot
    LEFT JOIN OrdenesFabricacion ofab 
        ON ot.EjercicioFabricacion = ofab.EjercicioFabricacion
        AND ot.SerieFabricacion = ofab.SerieFabricacion
        AND ot.NumeroFabricacion = ofab.NumeroFabricacion
    WHERE ot.CodigoEmpresa = 2
    AND ot.EjercicioTrabajo = 2026
    ORDER BY ot.EjercicioTrabajo DESC, ot.NumeroTrabajo DESC
"""

print("Running query...")
start = time.time()
try:
    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn)
        end = time.time()
        print(f"Query finished in {end - start:.2f}s")
        print(f"Rows found: {len(df)}")
        print(df.head())
except Exception as e:
    print(f"Error: {e}")
