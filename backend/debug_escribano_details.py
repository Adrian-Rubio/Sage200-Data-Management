import sys
sys.path.append('.')
from database import engine
from sqlalchemy import text
import pandas as pd

query = """
SELECT 
    k.CodigoComisionista,
    com.Comisionista,
    c.RazonSocial,
    k.ImporteLiquido,
    k.FechaAlbaran
FROM CabeceraAlbaranCliente k
JOIN Clientes c ON k.CodigoCliente = c.CodigoCliente AND k.CodigoEmpresa = c.CodigoEmpresa
LEFT JOIN Comisionistas com ON k.CodigoComisionista = com.CodigoComisionista AND k.CodigoEmpresa = com.CodigoEmpresa
WHERE c.RazonSocial LIKE '%ESCRIBANO%' 
AND k.StatusFacturado = 0
ORDER BY k.ImporteLiquido DESC
"""

try:
    df = pd.read_sql(text(query), engine)
    print("Escribano Pending Albaranes Details:")
    print(df.head(20))
except Exception as e:
    print(f"Error: {e}")
