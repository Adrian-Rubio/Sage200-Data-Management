from sqlalchemy import create_engine, text
from datetime import datetime, timedelta
import pandas as pd
import os
from dotenv import load_dotenv
from urllib.parse import quote_plus

load_dotenv('backend/.env')

server = os.getenv("DB_SERVER")
database = os.getenv("DB_DATABASE")
username = os.getenv("DB_USER")
password = os.getenv("DB_PASSWORD")
driver = os.getenv("DB_DRIVER")

params = quote_plus(f"DRIVER={{{driver}}};SERVER={server};DATABASE={database};UID={username};PWD={password}")
DATABASE_URL = f"mssql+pyodbc:///?odbc_connect={params}"

engine = create_engine(DATABASE_URL)

current_date = datetime.now()
first_day_this_month = current_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
last_day_last_month = first_day_this_month - timedelta(days=1)
last_month = last_day_last_month.month
last_year = last_day_last_month.year

q_sage_daily = """
    SELECT CAST(FechaFactura AS DATE) as Fecha, CodigoEmpresa, SUM(BaseImponible) as Total
    FROM CEN_PowerBI_LineasAlbaranesFacturadosSinDuplicados WITH (NOLOCK)
    WHERE CodigoEmpresa IN (2, 6)
      AND EjercicioFactura = :year 
      AND MONTH(FechaFactura) = :month
    GROUP BY CAST(FechaFactura AS DATE), CodigoEmpresa
"""

with engine.connect() as conn:
    sage_df = pd.read_sql(text(q_sage_daily), conn, params={"year": last_year, "month": last_month})

print("Datos Saratur (Empresa 6):")
print(sage_df[sage_df['CodigoEmpresa'] == 6])
