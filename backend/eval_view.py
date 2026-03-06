from sqlalchemy import create_engine, text
import pandas as pd

engine = create_engine('mssql+pyodbc://cenval:Cenvalsa#104$@SERV02-VM1/Sage?driver=ODBC Driver 17 for SQL Server&TrustServerCertificate=yes')

with engine.connect() as conn:
    print("--- Columns in Vis_AEL_DiarioFactxComercial ---")
    q = "SELECT TOP 1 * FROM Vis_AEL_DiarioFactxComercial"
    df = pd.read_sql(text(q), conn)
    print(df.columns.tolist())
    
    print("\n--- Data Sample ---")
    print(df.T)
