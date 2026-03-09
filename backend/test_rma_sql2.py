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
    CAST(doc.DOCPalabrasLc AS VARCHAR(MAX)) AS DOCPalabrasLc,
    doc.CodigoCliente,
    doc.CodigoArticulo,
    c.RazonSocial AS NombreCliente
FROM
    LcDOCPdf doc
LEFT JOIN Clientes c ON doc.CodigoCliente = c.CodigoCliente AND doc.CodigoEmpresa = c.CodigoEmpresa
WHERE
    DATALENGTH(doc.DOCPalabrasLc) > 0
    AND doc.FechaAlta > '2025-01-01'
ORDER BY doc.FechaAlta DESC
"""

df = pd.read_sql(text(query), engine)

print("Total results:", len(df))
print(df.head(10).to_string())

# Simulate Power Query Logic
df = df[df['DOCPalabrasLc'].notna() & (df['DOCPalabrasLc'] != "")]

# Split by pipe
split_col1 = df['DOCPalabrasLc'].str.split('|', expand=True)

if split_col1.shape[1] >= 2:
    df['Unidades'] = split_col1[0]
    
    split_col2 = split_col1[1].str.split('|', expand=True, n=1)
    if split_col2.shape[1] >= 2:
        df['Tipo error'] = split_col2[0].str.strip()
        df['Razon'] = split_col2[1].str.strip()
    elif split_col2.shape[1] == 1:
        df['Tipo error'] = split_col2[0].str.strip()
        df['Razon'] = None
else:
    df['Unidades'] = None
    df['Tipo error'] = None
    df['Razon'] = None

# Further normalization
df['Tipo error'] = df['Tipo error'].replace({
    "ERROR PREPARACION": "Error preparacion",
    "ERROR ADMINISTRATIVO": "Error administrativo",
    "ERROR PRODUCCION": "Error produccion",
    "ERROR CLIENTE": "Error cliente",
    "Error producción": "Error produccion",
    "ERROR PROVEEODR": "Error proveedor",
    "ERROR COMERCIAL": "Error comercial",
    "ERROR PROVEEDOR ": "Error proveedor",
    "ERROR PROVEEDOR": "Error proveedor"
})

def safe_int(val):
    try:
        if pd.isna(val): return 0
        val = str(val).replace("100-100", "100")
        return int(float(val))
    except:
        return 0

df['Unidades'] = df['Unidades'].apply(safe_int)
df['Estado'] = df['DOCSeguimientoLc'].apply(lambda x: "Abierto" if x == -1 else "Cerrado" if x == 0 else None)

print("\nProcessed Data:")
print(df[['NombreCliente', 'FechaAlta', 'Unidades', 'Tipo error', 'Razon', 'Estado']].head(10).to_string())
