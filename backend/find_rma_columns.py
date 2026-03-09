import pandas as pd
from sqlalchemy import text
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import engine

query = """
SELECT TABLE_NAME, COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE COLUMN_NAME LIKE '%Razon%' 
   OR COLUMN_NAME LIKE '%DOCNombreLc%' 
   OR TABLE_NAME LIKE '%RMA%' 
   OR COLUMN_NAME LIKE '%error%'
   OR TABLE_NAME = 'LcDOCPdf'
   OR TABLE_NAME = 'MovimientoStock'
"""
df = pd.read_sql(text(query), engine)
with open('backend/rma_columns_utf8.txt', 'w', encoding='utf-8') as f:
    f.write(df.to_string())

query_rma = """
SELECT TOP 20 * FROM LcDOCPdf WHERE DOCNombreLc LIKE 'RC%' OR DOCNombreLc LIKE '%RMA%'
"""
try:
    df_rma = pd.read_sql(text(query_rma), engine)
    with open('backend/rma_data_utf8.txt', 'w', encoding='utf-8') as f:
        f.write(df_rma.to_string())
except Exception as e:
    pass
