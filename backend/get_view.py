import pandas as pd
from sqlalchemy import create_engine, text

engine = create_engine('mssql+pyodbc://cenval:Cenvalsa#104$@SERV02-VM1/Sage?driver=ODBC Driver 17 for SQL Server&TrustServerCertificate=yes')
with engine.connect() as conn:
    res = conn.execute(text("SELECT definition FROM sys.sql_modules WHERE object_id = OBJECT_ID('PowerBi_ComprasDetalle')")).fetchone()
    if res:
        with open('view_def.txt', 'w', encoding='utf-8') as f:
            f.write(res[0])
    else:
        print("View not found")
