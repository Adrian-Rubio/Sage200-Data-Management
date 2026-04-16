from database import engine
from sqlalchemy import text
import json

def get_columns(table):
    query = f"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{table}'"
    with engine.connect() as conn:
        result = conn.execute(text(query))
        return [r[0] for r in result]

print("Familias columns:")
print(json.dumps(get_columns('Familias'), indent=2))
print("\nSubfamilias columns:")
print(json.dumps(get_columns('Subfamilias'), indent=2))

with engine.connect() as conn:
    print("\nSample Data:")
    q = """
    SELECT TOP 3 f.Nombre as Familia, s.Nombre as Subfamilia
    FROM Subfamilias s
    JOIN Familias f ON s.CodigoFamilia = f.CodigoFamilia AND s.CodigoEmpresa = f.CodigoEmpresa
    WHERE s.CodigoEmpresa = 2
    """
    res = conn.execute(text(q))
    for r in res:
        print(r)
