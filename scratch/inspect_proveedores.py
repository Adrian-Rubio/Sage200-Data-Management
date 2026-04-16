from database import engine
from sqlalchemy import text
import json

def get_columns(table):
    query = f"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{table}'"
    with engine.connect() as conn:
        result = conn.execute(text(query))
        return [r[0] for r in result]

cols = get_columns('Proveedores')
print(f"Proveedores columns:")
print(json.dumps([c for c in cols if 'nom' in c.lower() or 'razon' in c.lower() or 'cod' in c.lower()], indent=2))

with engine.connect() as conn:
    print("\nSample Join:")
    q = """
    SELECT TOP 3 a.CodigoArticulo, a.CodigoProveedor, p.RazonSocial 
    FROM Articulos a 
    LEFT JOIN Proveedores p ON a.CodigoProveedor = p.CodigoProveedor AND a.CodigoEmpresa = p.CodigoEmpresa
    WHERE a.CodigoProveedor IS NOT NULL AND a.CodigoProveedor != ''
    """
    res = conn.execute(text(q))
    for r in res:
        print(r)

