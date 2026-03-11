from database import engine
from sqlalchemy import text

query = """
    SELECT 
        MAT_TAB.ArticuloComponente as code, 
        MAT_TAB.DescripcionLinea as description, 
        COUNT(DISTINCT MAT_TAB.NumeroTrabajo) as ot_count
    FROM ConsumosOT MAT_TAB
    JOIN OrdenesTrabajo OT_TAB ON MAT_TAB.CodigoEmpresa = OT_TAB.CodigoEmpresa AND MAT_TAB.EjercicioTrabajo = OT_TAB.EjercicioTrabajo AND MAT_TAB.NumeroTrabajo = OT_TAB.NumeroTrabajo
    WHERE OT_TAB.CodigoEmpresa = 2 
      AND (OT_TAB.EstadoOT < 2 OR (MAT_TAB.UnidadesNecesarias - MAT_TAB.UnidadesUsadas) > 0)
    GROUP BY MAT_TAB.ArticuloComponente, MAT_TAB.DescripcionLinea
"""

try:
    print("Executing query with execute().fetchall()...")
    with engine.connect() as conn:
        res = conn.execute(text(query)).fetchall()
        print(f"Success! Found {len(res)} articles.")
        for row in res[:3]:
            print(row)
except Exception as e:
    print(f"Error: {e}")
