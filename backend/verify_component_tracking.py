from database import engine
from sqlalchemy import text
import pandas as pd

code = 'OEMIC-NE011/000' # The PC Fanless component we found
comp = 2

query_comp = """
    SELECT 
        mat.EjercicioTrabajo as exercise,
        mat.NumeroTrabajo as work_num,
        SUM(mat.UnidadesNecesarias - mat.UnidadesUsadas) as qty_to_consume,
        'COMPONENTE' as role
    FROM ConsumosOT mat
    JOIN OrdenesTrabajo ot ON mat.CodigoEmpresa = ot.CodigoEmpresa
                        AND mat.EjercicioTrabajo = ot.EjercicioTrabajo 
                        AND mat.NumeroTrabajo = ot.NumeroTrabajo
                        AND ot.CodigoEmpresa = :comp
    WHERE mat.ArticuloComponente = :code
      AND ot.EstadoOT <> 3
      AND (mat.UnidadesNecesarias - mat.UnidadesUsadas) > 0
    GROUP BY mat.EjercicioTrabajo, mat.NumeroTrabajo
"""

try:
    with engine.connect() as conn:
        df = pd.read_sql(text(query_comp), conn, params={"code": code, "comp": comp})
        print(f"Correct consumption results for component {code}:")
        print(df.to_string())
except Exception as e:
    print(f"Error: {e}")
