from database import engine
from sqlalchemy import text
import pandas as pd

# Diagnostic: OTs that are not in State 0 or 1, but might have pending units
query_ots = """
SELECT TOP 20
    CodigoArticulo, 
    DescripcionArticulo, 
    EstadoOT, 
    NumeroTrabajo,
    UnidadesAFabricar,
    UnidadesFabricadas
FROM OrdenesTrabajo
WHERE CodigoEmpresa = 2 
  AND UnidadesAFabricar > UnidadesFabricadas
  AND EstadoOT NOT IN (0, 1) -- Look for pending units in "closed" or "held" states
ORDER BY NumeroTrabajo DESC
"""

# Diagnostic: Consumos where need > used but OT is not active
query_consumos = """
SELECT TOP 20
    c.CodigoArticulo, 
    c.UnidadesNecesarias, 
    c.UnidadesUsadas,
    ot.EstadoOT,
    c.NumeroTrabajo
FROM ConsumosOT c
JOIN OrdenesTrabajo ot ON c.CodigoEmpresa = ot.CodigoEmpresa 
                  AND c.EjercicioTrabajo = ot.EjercicioTrabajo 
                  AND c.NumeroTrabajo = ot.NumeroTrabajo
WHERE c.CodigoEmpresa = 2 
  AND (c.UnidadesNecesarias - c.UnidadesUsadas) > 0
  AND ot.EstadoOT NOT IN (0, 1)
ORDER BY c.NumeroTrabajo DESC
"""

# Diagnostic: How many active OTs vs how many have consumption records?
query_stats = """
SELECT 
    (SELECT COUNT(*) FROM OrdenesTrabajo WHERE CodigoEmpresa = 2 AND EstadoOT IN (0, 1)) as Total_Active_OTs,
    (SELECT COUNT(DISTINCT NumeroTrabajo) FROM ConsumosOT WHERE CodigoEmpresa = 2) as OTs_in_ConsumosOT,
    (SELECT COUNT(DISTINCT NumeroTrabajo) FROM pwb_MaterialesOrdenTrabajo) as OTs_in_pwb_Materiales
"""

try:
    print("--- OTs with pending units but state NOT 0 or 1 ---")
    df_ots = pd.read_sql(text(query_ots), engine)
    print(df_ots)
    
    print("\n--- Consumos with pending units but OT state NOT 0 or 1 ---")
    df_cons = pd.read_sql(text(query_consumos), engine)
    print(df_cons)
    
    print("\n--- General Stats ---")
    df_stats = pd.read_sql(text(query_stats), engine)
    print(df_stats)
except Exception as e:
    print(f"Error: {e}")
