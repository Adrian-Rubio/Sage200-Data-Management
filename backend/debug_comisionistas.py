import sys
sys.path.append('.')
from database import engine
from sqlalchemy import text
import pandas as pd

query = """
SELECT CodigoComisionista, Comisionista 
FROM Comisionistas 
WHERE Comisionista LIKE '%JUAN CARLOS%'
"""

try:
    df = pd.read_sql(text(query), engine)
    print("Juan Carlos Comisionistas:")
    print(df)
except Exception as e:
    print(f"Error: {e}")
