import sys
sys.path.append('.')
from database import engine
from sqlalchemy import text
import pandas as pd

query = """
SELECT TOP 20
    c.RazonSocial,
    k.ImporteLiquido,
    k.StatusFacturado,
    com.Comisionista
FROM CabeceraAlbaranCliente k
LEFT JOIN Clientes c ON k.CodigoCliente = c.CodigoCliente AND k.CodigoEmpresa = c.CodigoEmpresa
LEFT JOIN Comisionistas com ON k.CodigoComisionista = com.CodigoComisionista AND k.CodigoEmpresa = com.CodigoEmpresa
WHERE k.ImporteLiquido > 1000 AND k.StatusFacturado = 0
ORDER BY k.ImporteLiquido DESC
"""

try:
    df = pd.read_sql(text(query), engine)
    print("Sample Albaranes:")
    print(df)
    
    print("\nDistinct StatusFacturado:")
    print(df['StatusFacturado'].unique())
except Exception as e:
    print(f"Error: {e}")
