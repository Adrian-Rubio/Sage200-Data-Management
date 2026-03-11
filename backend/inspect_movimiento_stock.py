from database import engine
from sqlalchemy import text
import pandas as pd

query = "SELECT TOP 1 * FROM MovimientoStock"

try:
    df = pd.read_sql(text(query), engine)
    cols = df.columns.tolist()
    for i in range(0, len(cols), 5):
        print(", ".join(cols[i:i+5]))
    
    # Check data for a few columns
    relevant = ['CodigoEmpresa', 'CodigoArticulo', 'Fecha', 'Unidades', 'TipoMovimiento']
    # Check if these exist first
    actual_cols = set(cols)
    to_show = [c for c in relevant if c in actual_cols]
    
    query2 = f"SELECT TOP 5 {', '.join(to_show)} FROM MovimientoStock WHERE CodigoEmpresa = 2 ORDER BY Fecha DESC"
    df2 = pd.read_sql(text(query2), engine)
    print("\nRecent movements (Comp 2):")
    print(df2)
except Exception as e:
    print(f"Error: {e}")
