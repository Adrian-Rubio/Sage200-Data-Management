import pandas as pd
from sqlalchemy import text
from database import get_db

db = next(get_db())
# Query top 1 to see schema for VIS_CEN_LinAlbFacSD
query = "SELECT TOP 1 * FROM VIS_CEN_LinAlbFacSD"
df = pd.read_sql(text(query), db.bind)
print("Columns in VIS_CEN_LinAlbFacSD:")
for col in df.columns:
    print(col)

try:
    query2 = "SELECT TOP 1 * FROM c_albvenlin"
    df2 = pd.read_sql(text(query2), db.bind)
    print("\nColumns in c_albvenlin:")
    for col in df2.columns:
        print(col)
except Exception as e:
    print("c_albvenlin not found")

try:
    query3 = "SELECT TOP 1 * FROM LineasAlbaranCliente"
    df3 = pd.read_sql(text(query3), db.bind)
    print("\nColumns in LineasAlbaranCliente:")
    for col in df3.columns:
        print(col)
except Exception as e:
    print("LineasAlbaranCliente not found:", e)
