from database import engine
from sqlalchemy import text
import pandas as pd

# 1. Find the article code first
q_art = """
SELECT CodigoArticulo, DescripcionArticulo
FROM Articulos
WHERE DescripcionArticulo LIKE 'RUGGED AI INFERENCE%' AND CodigoEmpresa = 2
"""

# 2. Check OrdenesTrabajo for OT 773 and 774
q_ot = """
SELECT NumeroTrabajo, EjercicioTrabajo, CodigoArticulo, DescripcionArticulo, UnidadesAFabricar, UnidadesFabricadas, EstadoOT
FROM OrdenesTrabajo
WHERE NumeroTrabajo IN (773, 774) AND EjercicioTrabajo = 2026 AND CodigoEmpresa = 2
"""

# 3. Check ConsumosOT for OT 773 and 774
q_consumo = """
SELECT c.NumeroTrabajo, c.EjercicioTrabajo, c.CodigoArticulo, c.DescripcionArticulo, c.UnidadesNecesarias, c.UnidadesUsadas
FROM ConsumosOT c
WHERE c.NumeroTrabajo IN (773, 774) AND c.EjercicioTrabajo = 2026 AND c.CodigoEmpresa = 2
"""

try:
    with engine.connect() as conn:
        with open("investigation_results.txt", "w", encoding="utf-8") as f:
            f.write("--- ARTICLE ---\n")
            df_art = pd.read_sql(text(q_art), conn)
            f.write(df_art.to_string() + "\n")
            
            if not df_art.empty:
                art_code = df_art['CodigoArticulo'].iloc[0]
                f.write(f"\nArticle Code found: {art_code}\n")
            else:
                art_code = None
                f.write("\nNo article found matching description.\n")
            
            f.write("\n--- ORDENES TRABAJO ---\n")
            df_ot = pd.read_sql(text(q_ot), conn)
            f.write(df_ot.to_string() + "\n")
            
            f.write("\n--- CONSUMOS OT (ANY ARTICLE) ---\n")
            df_consumo = pd.read_sql(text(q_consumo), conn)
            f.write(df_consumo.to_string() + "\n")
            
            if art_code:
                f.write(f"\n--- CONSUMOS OT (FILTERED BY ARTICLE {art_code}) ---\n")
                filtered = df_consumo[df_consumo['CodigoArticulo'] == art_code]
                f.write(filtered.to_string() + "\n")
    print("Results written to investigation_results.txt")

except Exception as e:
    print(f"Error: {e}")
