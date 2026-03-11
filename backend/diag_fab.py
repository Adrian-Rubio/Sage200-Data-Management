from database import engine
from sqlalchemy import text
import pandas as pd

query = """
SELECT ot.CodigoArticulo, ot.DescripcionArticulo, ot.EstadoOT, ot.NumeroTrabajo
FROM OrdenesTrabajo ot
WHERE ot.CodigoEmpresa = 2 AND ot.EstadoOT IN (0, 1)
"""

try:
    df = pd.read_sql(text(query), engine)
    print("Active OT Products (State 0, 1):")
    print(df.head(20))
    print(f"\nTotal: {len(df)}")
    
    query2 = """
    SELECT mat.CodigoArticulo, a.DescripcionArticulo, ot.EstadoOT, mat.NumeroTrabajo
    FROM pwb_MaterialesOrdenTrabajo mat
    JOIN OrdenesTrabajo ot ON mat.EjercicioTrabajo = ot.EjercicioTrabajo 
                      AND mat.NumeroTrabajo = ot.NumeroTrabajo
                      AND ot.CodigoEmpresa = 2
    JOIN Articulos a ON mat.CodigoArticulo = a.CodigoArticulo AND a.CodigoEmpresa = 2
    WHERE ot.EstadoOT IN (0, 1)
      AND (mat.UnidadesPrevistas - mat.UnidadesReales) > 0
    """
    df2 = pd.read_sql(text(query2), engine)
    print("\nActive OT Components:")
    print(df2.head(20))
    print(f"\nTotal: {len(df2)}")

except Exception as e:
    print(f"Error: {e}")
