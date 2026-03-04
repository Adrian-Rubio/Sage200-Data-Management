import sys
sys.path.append('.')
from sqlalchemy import create_engine, text
from database import engine
import pandas as pd

with engine.connect() as conn:
    print("Searching for 'CYME' in various tables...")
    # Search in divisions, zones, or specific clients
    q1 = "SELECT TOP 5 * FROM CabeceraPedidoCliente WHERE RazonSocial LIKE '%CYME%' OR ObservacionesPedido LIKE '%CYME%'"
    res1 = pd.read_sql(text(q1), conn)
    print("Orders with CYME in name/obs:", len(res1))
    if not res1.empty: print(res1[['NumeroPedido', 'RazonSocial']].to_string())

    q2 = "SELECT TOP 5 * FROM LineasPedidoCliente WHERE DescripcionArticulo LIKE '%CYME%'"
    res2 = pd.read_sql(text(q2), conn)
    print("Lines with CYME in desc:", len(res2))

    # Check for specific zones
    q3 = "SELECT DISTINCT CodigoZona, CodigoTerritorio FROM CabeceraPedidoCliente WHERE CodigoEmpresa = 2"
    res3 = pd.read_sql(text(q3), conn)
    print("Available Zones/Territories:", res3.to_string())

    # Check Catalunya provinces
    q4 = "SELECT DISTINCT CodigoProvincia, Provincia FROM CabeceraPedidoCliente WHERE CodigoEmpresa = 2 AND (Provincia LIKE '%BARCELONA%' OR Provincia LIKE '%GIRONA%' OR Provincia LIKE '%LLEIDA%' OR Provincia LIKE '%TARRAGONA%')"
    res4 = pd.read_sql(text(q4), conn)
    print("Catalunya Provinces:", res4.to_string())
