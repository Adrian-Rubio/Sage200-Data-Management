from database import engine
from sqlalchemy import text
import json

def get_columns(table):
    query = f"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{table}'"
    try:
        with engine.connect() as conn:
            result = conn.execute(text(query))
            return [r[0] for r in result]
    except Exception as e:
        return [str(e)]

print("Vis_Familias columns:")
print(json.dumps(get_columns('Vis_Familias'), indent=2))
print("\nVis_SubFamilias columns:")
print(json.dumps(get_columns('Vis_SubFamilias'), indent=2))

with engine.connect() as conn:
    print("\nSample Data from Articulos with Subfam:")
    q = """
    SELECT TOP 3 a.CodigoArticulo, a.CodigoFamilia, a.CodigoSubfamilia 
    FROM Articulos a 
    WHERE a.CodigoEmpresa = 2 AND a.CodigoSubfamilia IS NOT NULL AND a.CodigoSubfamilia != ''
    """
    res = conn.execute(text(q))
    for r in res:
        print(r)
