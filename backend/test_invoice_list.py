import pandas as pd
from sqlalchemy import create_engine, text

engine = create_engine('mssql+pyodbc://cenval:Cenvalsa#104$@SERV02-VM1/Sage?driver=ODBC Driver 17 for SQL Server&TrustServerCertificate=yes')

with engine.connect() as conn:
    print("--- Feasibility of Invoices List ---")
    q = """
    SELECT TOP 5 
        f.NumeroFactura, 
        f.FechaFactura, 
        f.CodigoCliente, 
        f.RazonSocial, 
        f.BaseImponible, 
        f.Comisionista 
    FROM Vis_AEL_DiarioFactxComercial f 
    WHERE f.CodigoEmpresa = '2' 
    ORDER BY f.FechaFactura DESC
    """
    df = pd.read_sql(text(q), conn)
    print(df)
