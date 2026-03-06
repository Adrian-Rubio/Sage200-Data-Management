from sqlalchemy import create_engine, text
import pandas as pd

engine = create_engine('mssql+pyodbc://cenval:Cenvalsa#104$@SERV02-VM1/Sage?driver=ODBC Driver 17 for SQL Server&TrustServerCertificate=yes')

with engine.connect() as conn:
    print("Checking Reps in CEN_PowerBi_LineasPedVen_Vendedor...")
    q = """
    SELECT DISTINCT RTRIM(LTRIM(c.Comisionista)) as Rep 
    FROM CEN_PowerBi_LineasPedVen_Vendedor p 
    LEFT JOIN Comisionistas c ON p.CodigoComisionista = c.CodigoComisionista AND p.CodigoEmpresa = c.CodigoEmpresa 
    WHERE p.CodigoEmpresa = '2'
    """
    df = pd.read_sql(text(q), conn)
    print(df)
    
    print("\nChecking pending units for Valdes orders...")
    q_units = """
    SELECT SUM(UnidadesPendientes) as TotalPdte 
    FROM CEN_PowerBi_LineasPedVen_Vendedor p 
    LEFT JOIN Comisionistas c ON p.CodigoComisionista = c.CodigoComisionista AND p.CodigoEmpresa = c.CodigoEmpresa 
    WHERE UPPER(RTRIM(LTRIM(c.Comisionista))) = 'JUAN CARLOS VALDES ANTON' AND p.CodigoEmpresa = '2'
    """
    df_u = pd.read_sql(text(q_units), conn)
    print(df_u)
    
    print("\nChecking raw CodigoComisionista for Valdes in Comisionistas table...")
    q_raw = "SELECT CodigoComisionista, Comisionista FROM Comisionistas WHERE Comisionista LIKE '%VALDES%'"
    df_raw = pd.read_sql(text(q_raw), conn)
    print(df_raw)
