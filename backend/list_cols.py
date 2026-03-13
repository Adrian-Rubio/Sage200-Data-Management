import pyodbc
from sqlalchemy import text
from database import engine

try:
    with engine.connect() as conn:
        res = conn.execute(text("SELECT TOP 1 * FROM Vis_AEL_DiarioFactxComercial"))
        print("COLUMNS FOUND:")
        for key in res.keys():
            print(key)
except Exception as e:
    print(f"ERROR: {e}")
