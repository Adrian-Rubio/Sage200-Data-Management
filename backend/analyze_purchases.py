from database import engine
from sqlalchemy import text
import pandas as pd

def q(desc, query):
    print(f"\n--- {desc} ---")
    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn)
        print(df.to_string(index=False))

# 1. Distinct values of _AEL_OrigenPedido
q("Distinct values of _AEL_OrigenPedido", """
    SELECT DISTINCT _AEL_OrigenPedido 
    FROM CabeceraPedidoProveedor 
    WHERE EjercicioPedido >= 2024
""")

# 2. Check orders where _AEL_OrigenPedido is NULL or empty
q("Sample orders where _AEL_OrigenPedido is NULL or empty", """
    SELECT TOP 10 EjercicioPedido, SeriePedido, NumeroPedido, _AEL_OrigenPedido, RazonSocial
    FROM CabeceraPedidoProveedor 
    WHERE EjercicioPedido >= 2024 AND (_AEL_OrigenPedido IS NULL OR _AEL_OrigenPedido = '')
""")

# 3. Check status of these orders
q("Status of orders with NULL/Empty _AEL_OrigenPedido", """
    SELECT TOP 10 EjercicioPedido, NumeroPedido, _AEL_OrigenPedido, 
           (SELECT SUM(UnidadesPedidas) FROM LineasPedidoProveedor l WHERE l.EjercicioPedido = c.EjercicioPedido AND l.NumeroPedido = c.NumeroPedido) as SumPed,
           (SELECT SUM(UnidadesRecibidas) FROM LineasPedidoProveedor l WHERE l.EjercicioPedido = c.EjercicioPedido AND l.NumeroPedido = c.NumeroPedido) as SumRec,
           (SELECT SUM(UnidadesPendientes) FROM LineasPedidoProveedor l WHERE l.EjercicioPedido = c.EjercicioPedido AND l.NumeroPedido = c.NumeroPedido) as SumPen
    FROM CabeceraPedidoProveedor c
    WHERE EjercicioPedido >= 2024 AND (_AEL_OrigenPedido IS NULL OR _AEL_OrigenPedido = '')
""")
