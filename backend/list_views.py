from sqlalchemy import create_engine, text
import pandas as pd

engine = create_engine('mssql+pyodbc://cenval:Cenvalsa#104$@SERV02-VM1/Sage?driver=ODBC Driver 17 for SQL Server&TrustServerCertificate=yes')
with engine.connect() as conn:
    print("Views:")
    q = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_NAME LIKE 'CEN_PowerBI_%'"
    res = pd.read_sql(text(q), conn)
    print(res)
