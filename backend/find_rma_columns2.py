import pandas as pd
from sqlalchemy import text
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import engine

query = """
SELECT TABLE_NAME, COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE COLUMN_NAME IN ('Tipo error', 'TipoError', 'Unidades', 'Cantidad', 'Razon', 'Motivo')
   OR COLUMN_NAME LIKE '%Error%' 
   OR COLUMN_NAME LIKE '%Razon%'
"""
df = pd.read_sql(text(query), engine)
with open('backend/rma_columns2_utf8.txt', 'w', encoding='utf-8') as f:
    f.write(df.to_string())

query2 = """
SELECT TABLE_NAME, COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME IN ('LcDOCPdf', 'MovimientoStock', 'CabeceraAlbaranCliente', 'Clientes')
"""
df2 = pd.read_sql(text(query2), engine)
df2_filtered = df2[df2['COLUMN_NAME'].str.contains('error|razon|unidades|cantidad|motivo', case=False, na=False)]

with open('backend/rma_columns2_filtered_utf8.txt', 'w', encoding='utf-8') as f:
    f.write(df2_filtered.to_string())
