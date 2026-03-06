from sqlalchemy import create_engine, text
import pandas as pd

engine = create_engine('mssql+pyodbc://cenval:Cenvalsa#104$@SERV02-VM1/Sage?driver=ODBC Driver 17 for SQL Server&TrustServerCertificate=yes')

with engine.connect() as conn:
    print("--- BILLING IN MARCH FOR VALDES ---")
    q_billing = """
    SELECT TOP 5 NumeroFactura, FechaFactura, Comisionista, BaseImponible 
    FROM Vis_AEL_DiarioFactxComercial 
    WHERE UPPER(RTRIM(LTRIM(Comisionista))) LIKE '%VALDES%' 
    AND FechaFactura >= '2026-03-01'
    """
    print(pd.read_sql(text(q_billing), conn))

    print("\n--- CHECKING HEADERS FOR MARCH ---")
    # Let's see if he has any order headers in March
    q_headers = """
    SELECT TOP 5 c.NumeroPedido, c.FechaPedido, com.Comisionista
    FROM CabeceraPedidoCliente c
    LEFT JOIN Comisionistas com ON c.CodigoComisionista = com.CodigoComisionista AND c.CodigoEmpresa = com.CodigoEmpresa
    WHERE c.FechaPedido >= '2026-03-01' 
    AND UPPER(RTRIM(LTRIM(com.Comisionista))) LIKE '%VALDES%'
    """
    print(pd.read_sql(text(q_headers), conn))

    print("\n--- CHECKING LINES FOR MARCH (NO REP FILTER) ---")
    q_trace = """
    SELECT TOP 10 NumeroFactura, FechaFactura, NumeroAlbaran, CodigoComisionista
    FROM VIS_CEN_LinAlbFacSD
    WHERE FechaFactura >= '2026-03-01' AND CodigoEmpresa = '2'
    """
    print(pd.read_sql(text(q_trace), conn))
    
    print("\n--- CHECKING PEDIDOS VIEW FOR VALDES IN Q1 ---")
    q_pedidos = """
    SELECT TOP 10 NumeroPedido, FechaPedido, Comisionista 
    FROM CEN_PowerBi_LineasPedVen_Vendedor p
    LEFT JOIN Comisionistas c ON p.CodigoComisionista = c.CodigoComisionista AND p.CodigoEmpresa = c.CodigoEmpresa
    WHERE UPPER(RTRIM(LTRIM(c.Comisionista))) LIKE '%VALDES%'
    ORDER BY FechaPedido DESC
    """
    print(pd.read_sql(text(q_pedidos), conn))
