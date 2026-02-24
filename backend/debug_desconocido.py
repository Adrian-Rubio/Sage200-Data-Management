from database import engine
from sqlalchemy import text
import pandas as pd

def q(desc, query):
    print(f"\n--- {desc} ---")
    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn)
        print(f"Total rows: {len(df)}")
        if not df.empty:
            print(df.head(10).to_string(index=False))

# Check orders that would result in "Desconocido" status
# status_global = 'Desconocido' if not (pend<=0 and rec>0) and not (rec>0 and pend>0) and not (rec==0 and ped>0)
# which effectively means total_pedidas == 0 AND total_recibidas == 0
q("Orders with 0 units (likely 'Desconocido' candidates)", """
    SELECT c.EjercicioPedido, c.SeriePedido, c.NumeroPedido, c._AEL_OrigenPedido, c.Estado,
           (SELECT COUNT(*) FROM LineasPedidoProveedor l WHERE l.EjercicioPedido = c.EjercicioPedido AND l.NumeroPedido = c.NumeroPedido) as NumLines,
           (SELECT SUM(UnidadesPedidas) FROM LineasPedidoProveedor l WHERE l.EjercicioPedido = c.EjercicioPedido AND l.NumeroPedido = c.NumeroPedido) as SumPed
    FROM CabeceraPedidoProveedor c
    WHERE EjercicioPedido >= 2024 AND Estado = 0
    AND NOT EXISTS (
        SELECT 1 FROM LineasPedidoProveedor l 
        WHERE l.EjercicioPedido = c.EjercicioPedido AND l.NumeroPedido = c.NumeroPedido
        AND (UnidadesPedidas > 0 OR UnidadesRecibidas > 0 OR UnidadesPendientes > 0)
    )
""")

# Check "NORMAL" orders
q("Sample NORMAL orders", """
    SELECT TOP 10 EjercicioPedido, SeriePedido, NumeroPedido, _AEL_OrigenPedido, Estado
    FROM CabeceraPedidoProveedor
    WHERE EjercicioPedido >= 2024 AND _AEL_OrigenPedido = 'NORMAL'
""")
