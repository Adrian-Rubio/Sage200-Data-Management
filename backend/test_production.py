from database import SessionLocal
from sqlalchemy import text
import pandas as pd

db = SessionLocal()

print("=== pwb_MaterialesOrdenTrabajo: cols sin filtro empresa ===")
try:
    row = db.execute(text("SELECT TOP 1 * FROM pwb_MaterialesOrdenTrabajo")).fetchone()
    cols = list(row._mapping.keys())
    print("Columnas:", cols)
    for k, v in row._mapping.items():
        print(f"  {k} = {v}")
except Exception as e:
    print(f"Error: {e}")

print("\n=== Buscar artículo específico en materiales ===")
# Try to find article 21100464 as a component
try:
    df = pd.read_sql(text("SELECT TOP 5 * FROM pwb_MaterialesOrdenTrabajo WHERE CodigoArticulo = '21100464'"), db.bind)
    print(df.to_string())
except Exception as e:
    print(f"Error: {e}")
    # Try different column name
    try:
        row2 = db.execute(text("SELECT TOP 1 * FROM pwb_MaterialesOrdenTrabajo")).fetchone()
        cols2 = list(row2._mapping.keys())
        art_cols = [c for c in cols2 if 'articulo' in c.lower() or 'codigo' in c.lower()]
        print(f"Cols con articulo/codigo: {art_cols}")
    except Exception as e2:
        print(f"Error2: {e2}")
