from database import engine
from sqlalchemy import text
import pandas as pd

query = "SELECT TOP 10 * FROM pwb_MaterialesOrdenTrabajo"

try:
    df = pd.read_sql(text(query), engine)
    print("Contents of pwb_MaterialesOrdenTrabajo:")
    print(df)
except Exception as e:
    print(f"Error: {e}")

query2 = "SELECT TOP 10 * FROM pwb_DetalleMaterialOFs"
try:
    df2 = pd.read_sql(text(query2), engine)
    print("\nContents of pwb_DetalleMaterialOFs:")
    print(df2)
except Exception as e:
    print(f"Error: {e}")
