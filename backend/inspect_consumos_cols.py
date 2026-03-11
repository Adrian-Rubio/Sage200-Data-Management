from database import engine
from sqlalchemy import text
import pandas as pd

query = "SELECT TOP 1 * FROM ConsumosOT"

try:
    df = pd.read_sql(text(query), engine)
    cols = sorted(df.columns.tolist())
    for i in range(0, len(cols), 5):
        print(", ".join(cols[i:i+5]))
        
    # Check for actual columns related to article and quantities
    print("\nInteresting columns:")
    interesting = [c for c in cols if 'Articulo' in c or 'Unidad' in c or 'Prev' in c or 'Real' in c]
    print(interesting)
except Exception as e:
    print(f"Error: {e}")
