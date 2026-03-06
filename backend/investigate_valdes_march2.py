from sqlalchemy import create_engine, text
import pandas as pd

engine = create_engine('mssql+pyodbc://cenval:Cenvalsa#104$@SERV02-VM1/Sage?driver=ODBC Driver 17 for SQL Server&TrustServerCertificate=yes')

with engine.connect() as conn:
    print("--- 1. Def of CEN_PowerBi_LineasPedVen_Vendedor ---")
    q1 = "SELECT OBJECT_DEFINITION(OBJECT_ID('CEN_PowerBi_LineasPedVen_Vendedor')) as def"
    df_def = pd.read_sql(text(q1), conn)
    print(df_def['def'].iloc[0])

    print("\n--- 2. Checking Headers and Lines for Valdes in March ---")
    q2 = """
    SELECT TOP 10 
        c.NumeroPedido as Pedido,
        c.FechaPedido,
        c.CodigoComisionista as CabeceraRepID,
        comC.Comisionista as CabeceraRepName,
        l.CodigoArticulo,
        l.UnidadesPedidas as Unidades,
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
    df_orders = pd.read_sql(text(q2), conn)
    pd.set_option('display.max_columns', None)
    pd.set_option('display.width', 1000)
    print(df_orders)
