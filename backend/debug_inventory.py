import pandas as pd
from sqlalchemy import create_engine, text

engine = create_engine('mssql+pyodbc://cenval:Cenvalsa#104$@SERV02-VM1/Sage?driver=ODBC Driver 17 for SQL Server&TrustServerCertificate=yes')
with engine.connect() as conn:
    print("Latest data in PowerBi_AcumuladoStock:")
    q = "SELECT TOP 10 Ejercicio, Periodo, COUNT(*) as Rows FROM PowerBi_AcumuladoStock WITH (NOLOCK) GROUP BY Ejercicio, Periodo ORDER BY Ejercicio DESC, Periodo DESC"
    res = pd.read_sql(text(q), conn)
    print(res)

    print("\nCompanies in PowerBi_AcumuladoStock:")
    q3 = "SELECT CodigoEmpresa, COUNT(*) as Rows FROM PowerBi_AcumuladoStock WITH (NOLOCK) GROUP BY CodigoEmpresa"
    res3 = pd.read_sql(text(q3), conn)
    print(res3)
