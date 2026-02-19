import sys
sys.path.append('.')
from database import engine
from sqlalchemy import text
import pandas as pd

pd.set_option('display.max_columns', None)

query = """
SELECT 
    CodigoComisionista, ImporteComision,
    CodigoComisionista2_, ImporteComision2_,
    CodigoComisionista3_, ImporteComision3_,
    CodigoComisionista4_, ImporteComision4_,
    ImporteLiquido
FROM CabeceraAlbaranCliente 
WHERE ImporteLiquido > 100000 AND StatusFacturado = 0
"""

try:
    df = pd.read_sql(text(query), engine)
    print("Commission Details Full:")
    print(df)
except Exception as e:
    print(f"Error: {e}")
