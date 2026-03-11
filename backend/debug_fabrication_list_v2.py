from database import engine
from sqlalchemy import text
import pandas as pd

comp = 2

query = """
    WITH ProductionEntries AS (
        -- Articles being manufactured
        SELECT CodigoArticulo as code, DescripcionArticulo as description, NumeroTrabajo
        FROM OrdenesTrabajo
        WHERE CodigoEmpresa = :comp 
          AND (EstadoOT < 2 OR (UnidadesAFabricar - UnidadesFabricadas) > 0)
        
        UNION ALL
        
        -- Components required for manufacturing
        SELECT mat.ArticuloComponente as code, COALESCE(a.DescripcionArticulo, mat.DescripcionLinea) as description, mat.NumeroTrabajo
        FROM ConsumosOT mat
        JOIN OrdenesTrabajo ot ON mat.CodigoEmpresa = ot.CodigoEmpresa
                          AND mat.EjercicioTrabajo = ot.EjercicioTrabajo 
                          AND mat.NumeroTrabajo = ot.NumeroTrabajo
        LEFT JOIN Articulos a ON mat.ArticuloComponente = a.CodigoArticulo AND a.CodigoEmpresa = :comp
        WHERE ot.CodigoEmpresa = :comp
          AND (ot.EstadoOT < 2 OR (mat.UnidadesNecesarias - mat.UnidadesUsadas) > 0)
    )
    SELECT code, MAX(description) as description, COUNT(DISTINCT NumeroTrabajo) as total_ots
    FROM ProductionEntries
    GROUP BY code
    ORDER BY total_ots DESC
"""

try:
    with engine.connect() as conn:
        print("Executing SQL:")
        df = pd.read_sql(text(query), conn, params={"comp": comp})
        print(f"\nResults for articles in fabrication (Total rows: {len(df)}):")
        if not df.empty:
            print(df.head(20).to_string())
        else:
            print("No rows returned.")
except Exception as e:
    print(f"Error: {e}")
