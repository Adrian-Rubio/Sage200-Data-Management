import os
import sys
# Add current directory to path
sys.path.append(os.getcwd())

from database import SessionLocal
from sqlalchemy import text
import pandas as pd
from datetime import date

db = SessionLocal()

# Mock filters
class Filters:
    start_date = None
    end_date = None
    company_id = None
    sales_rep_id = None
    division = None

filters = Filters()

basic_query = """
            SELECT 
                c.Comisionista,
                p.BaseImponiblePendiente,
                p.UnidadesPendientes, 
                p.PrecioCoste,
                p.NumeroPedido,
                p.CodigoComisionista,
                cl.RazonSocial as Cliente
            FROM CEN_PowerBi_LineasPedVen_Vendedor p
            LEFT JOIN Comisionistas c ON p.CodigoComisionista = c.CodigoComisionista AND p.CodigoEmpresa = c.CodigoEmpresa
            LEFT JOIN Clientes cl ON p.CodigoCliente = cl.CodigoCliente AND p.CodigoEmpresa = cl.CodigoEmpresa
            WHERE p.UnidadesPendientes > 0
            AND p.CodigoEmpresa <> '100'
        """

try:
    df = pd.read_sql(text(basic_query), db.bind)
    print("Query success. Columns:", list(df.columns))
    print("DF Empty?", df.empty)
except Exception as e:
    print("QUERY ERROR:", e)
finally:
    db.close()
