
from sqlalchemy import text
from database import engine, SessionLocal
import pandas as pd

def debug():
    db = SessionLocal()
    try:
        # Check if table exists
        print("Checking if purchase_tracking exists...")
        try:
            db.execute(text("SELECT TOP 1 * FROM purchase_tracking"))
            print("Table purchase_tracking exists.")
        except Exception as e:
            print(f"Error checking purchase_tracking: {e}")
            
        # Try the full query
        query = """
            SELECT TOP 5
                c.CodigoEmpresa, c.EjercicioPedido, c.SeriePedido, c.NumeroPedido,
                COALESCE(p.FechaPedido, c.FechaPedido) as FechaPedidoPadre,
                c.FechaPedido as FechaPedidoReal,
                c._AEL_NumeroPedOrigen as NumeroPedidoPadre,
                c.RazonSocial as Proveedor,
                c.Nacion as PaisOrigen,
                c.Estado,
                t.incoterm, t.medio_transporte, t.agencia_transporte, t.ref_envio
            FROM CabeceraPedidoProveedor c
            LEFT JOIN CabeceraPedidoProveedor p 
              ON c._AEL_EjercicioPedOrigen = p.EjercicioPedido 
              AND c._AEL_SeriePedOrigen = p.SeriePedido 
              AND c._AEL_NumeroPedOrigen = p.NumeroPedido 
              AND c.CodigoEmpresa = p.CodigoEmpresa
            LEFT JOIN purchase_tracking t
              ON c.CodigoEmpresa = t.codigo_empresa
              AND c.EjercicioPedido = t.ejercicio_pedido
              AND c.SeriePedido = t.serie_pedido
              AND c.NumeroPedido = t.numero_pedido
            WHERE c.CodigoEmpresa = 2
            ORDER BY FechaPedidoPadre DESC
        """
        print("Executing full query...")
        df = pd.read_sql(text(query), engine)
        print("Query executed successfully.")
        print(df.head())
    except Exception as e:
        print(f"Error executing query: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug()
