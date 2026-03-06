import pandas as pd
from sqlalchemy import create_engine, text

engine = create_engine('mssql+pyodbc://cenval:Cenvalsa#104$@SERV02-VM1/Sage?driver=ODBC Driver 17 for SQL Server&TrustServerCertificate=yes')

with engine.connect() as conn:
    q2 = """
    SELECT TOP 10 
        c.NumeroPedido,
        c.FechaPedido,
        c.CodigoComisionista as CabeceraRepID,
        comC.Comisionista as CabeceraRepName,
        l.CodigoComisionista as LineaRepID,
        comL.Comisionista as LineaRepName
    FROM CabeceraPedidoCliente c
    JOIN LineasPedidoCliente l ON c.NumeroPedido = l.NumeroPedido AND c.CodigoEmpresa = l.CodigoEmpresa
    LEFT JOIN Comisionistas comC ON c.CodigoComisionista = comC.CodigoComisionista AND c.CodigoEmpresa = comC.CodigoEmpresa
    LEFT JOIN Comisionistas comL ON l.CodigoComisionista = comL.CodigoComisionista AND l.CodigoEmpresa = comL.CodigoEmpresa
    WHERE c.CodigoEmpresa = '2' 
      AND c.FechaPedido >= '2026-03-01'
      AND (
          UPPER(RTRIM(LTRIM(comC.Comisionista))) LIKE '%VALDES%'
          OR 
          UPPER(RTRIM(LTRIM(comL.Comisionista))) LIKE '%VALDES%'
      )
    ORDER BY c.FechaPedido DESC
    """
    df = pd.read_sql(text(q2), conn)
    with open('valdes_orders.json', 'w') as f:
        df.to_json(f, orient='records', indent=2)

    q1 = "SELECT OBJECT_DEFINITION(OBJECT_ID('CEN_PowerBi_LineasPedVen_Vendedor')) as def"
    df_def = pd.read_sql(text(q1), conn)
    with open('view_def_clean.sql', 'w') as f:
        f.write(df_def['def'].iloc[0])

print("Files valdes_orders.json and view_def_clean.sql created.")
