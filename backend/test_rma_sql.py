import pandas as pd
from sqlalchemy import text
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import engine

query = """
SELECT TOP 50
    doc.CodigoEmpresa,
    doc.DOCNombreLc,
    doc.FechaAlta,
    doc.DOCSeguimientoLc,
    doc.DOCPalabrasLc,
    doc.CodigoCliente,
    doc.CodigoArticulo,
    c.RazonSocial AS NombreCliente
FROM
    LcDOCPdf doc
LEFT JOIN Clientes c ON doc.CodigoCliente = c.CodigoCliente AND doc.CodigoEmpresa = c.CodigoEmpresa
WHERE
    doc.DOCPalabrasLc IS NOT NULL 
    AND doc.DOCPalabrasLc <> ''
    AND doc.FechaAlta > '2025-01-01'
ORDER BY doc.FechaAlta DESC
"""

df = pd.read_sql(text(query), engine)

print("Total results:", len(df))
print(df.head(10).to_string())
