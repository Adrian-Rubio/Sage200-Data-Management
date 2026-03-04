import pandas as pd
from sqlalchemy import create_engine, text

engine = create_engine('mssql+pyodbc://cenval:Cenvalsa#104$@SERV02-VM1/Sage?driver=ODBC Driver 17 for SQL Server&TrustServerCertificate=yes')
with engine.connect() as conn:
    q = "SELECT name FROM sys.views WHERE name LIKE '%Stock%' OR name LIKE '%Inventario%' OR name LIKE '%Almacen%' OR name LIKE '%Familias%'"
    res = pd.read_sql(text(q), conn)
    print("MATCHING VIEWS:")
    print(res['name'].tolist())
    
    # Also check if there's a specific view for Almacen
    q2 = "SELECT name FROM sys.tables WHERE name LIKE '%Stock%' OR name LIKE '%Inventario%'"
    res2 = pd.read_sql(text(q2), conn)
    print("\nMATCHING TABLES:")
    print(res2['name'].tolist())
