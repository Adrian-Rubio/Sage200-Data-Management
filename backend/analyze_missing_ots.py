from database import engine
from sqlalchemy import text
import pandas as pd

# Check for OTs that might be missed by the current dashboard logic
# Dashboard excludes EstadoOT = 3 (Retenida) and those with balance = 0

query_check = """
SELECT 
    ot.EstadoOT, 
    COUNT(*) as Total,
    SUM(CASE WHEN (ot.UnidadesAFabricar - ot.UnidadesFabricadas) > 0 THEN 1 ELSE 0 END) as PendingQty,
    SUM(CASE WHEN (ot.UnidadesAFabricar - ot.UnidadesFabricadas) <= 0 THEN 1 ELSE 0 END) as NoPendingQty
FROM OrdenesTrabajo ot
WHERE ot.CodigoEmpresa = 2 AND ot.EjercicioTrabajo >= 2025
GROUP BY ot.EstadoOT
ORDER BY ot.EstadoOT
"""

try:
    with engine.connect() as conn:
        print("OT Statistics for Company 2 (2025+):")
        df = pd.read_sql(text(query_check), conn)
        print(df.to_string())
        
        # Check for ConsumosOT that belong to Finished or Retained OTs
        query_check_consumos = """
        SELECT 
            ot.EstadoOT,
            COUNT(DISTINCT ot.NumeroTrabajo) as OTsWithConsumos,
            COUNT(*) as TotalConsumoLines
        FROM ConsumosOT c
        JOIN OrdenesTrabajo ot ON c.CodigoEmpresa = ot.CodigoEmpresa AND c.EjercicioTrabajo = ot.EjercicioTrabajo AND c.NumeroTrabajo = ot.NumeroTrabajo
        WHERE c.CodigoEmpresa = 2 AND ot.EjercicioTrabajo >= 2025
          AND (c.UnidadesNecesarias - c.UnidadesUsadas) > 0
        GROUP BY ot.EstadoOT
        ORDER BY ot.EstadoOT
        """
        print("\nActive Consumptions (Pending Qty) by OT Status:")
        df_cons = pd.read_sql(text(query_check_consumos), conn)
        print(df_cons.to_string())

except Exception as e:
    print(f"Error: {e}")
