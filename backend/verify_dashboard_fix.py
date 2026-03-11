from database import engine
from sqlalchemy import text
import pandas as pd

code = 'OM05487-000/002'
comp = 2

# The FIX: use ArticuloComponente
query_comp = """
    SELECT 
        mat.EjercicioTrabajo as exercise,
        mat.NumeroTrabajo as work_num,
        SUM(mat.UnidadesNecesarias - mat.UnidadesUsadas) as qty_to_make,
        0 as qty_made,
        ot.EstadoOT as status,
        ot.FechaFinalPrevista as date_expected,
        'COMPONENTE' as role
    FROM ConsumosOT mat
    JOIN OrdenesTrabajo ot ON mat.CodigoEmpresa = ot.CodigoEmpresa
                        AND mat.EjercicioTrabajo = ot.EjercicioTrabajo 
                        AND mat.NumeroTrabajo = ot.NumeroTrabajo
                        AND ot.CodigoEmpresa = :comp
    WHERE mat.ArticuloComponente = :code
      AND ot.EstadoOT <> 3
      AND (mat.UnidadesNecesarias - mat.UnidadesUsadas) > 0
    GROUP BY mat.EjercicioTrabajo, mat.NumeroTrabajo, ot.EstadoOT, ot.FechaFinalPrevista
"""

try:
    with engine.connect() as conn:
        df = pd.read_sql(text(query_comp), conn, params={"code": code, "comp": comp})
        print(f"Results for {code} as component (FIXED):")
        if df.empty:
            print("No (false) consumptions found for this assembly. FIX WORKS!")
        else:
            print(df.to_string())
except Exception as e:
    print(f"Error: {e}")
