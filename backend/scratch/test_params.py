
from sqlalchemy import text
from database import engine
import pandas as pd

def debug():
    params = {"offset": 0, "limit": 50}
    query = """
        SELECT TOP 5
            c.CodigoEmpresa, c.EjercicioPedido, c.SeriePedido, c.NumeroPedido,
            COALESCE(p.FechaPedido, c.FechaPedido) as FechaPedidoPadre
        FROM CabeceraPedidoProveedor c
        LEFT JOIN CabeceraPedidoProveedor p 
          ON c._AEL_EjercicioPedOrigen = p.EjercicioPedido 
          AND c._AEL_SeriePedOrigen = p.SeriePedido 
          AND c._AEL_NumeroPedOrigen = p.NumeroPedido 
          AND c.CodigoEmpresa = p.CodigoEmpresa
        WHERE c.CodigoEmpresa = 2
        ORDER BY FechaPedidoPadre DESC
        OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    """
    try:
        print("Executing query with params...")
        df = pd.read_sql(text(query), engine, params=params)
        print("Success!")
        print(df)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug()
