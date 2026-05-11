
from sqlalchemy import text
from database import engine
import pandas as pd

def debug():
    params = {"offset": 0, "limit": 50}
    query = """
        SELECT 
            c.CodigoEmpresa, c.EjercicioPedido, c.SeriePedido, c.NumeroPedido,
            COALESCE(p.FechaPedido, c.FechaPedido) as FechaPedidoPadre,
            c.FechaPedido as FechaPedidoReal,
            c._AEL_NumeroPedOrigen as NumeroPedidoPadre,
            c.RazonSocial as Proveedor,
            c.Nacion as PaisOrigen,
            c.Estado,
            t.incoterm, t.medio_transporte, t.agencia_transporte, t.ref_envio,
            t.bultos, t.volumen, t.peso,
            t.fecha_establecida_inicial, t.fecha_real_proveedor, t.fecha_recogida_real,
            t.fecha_salida_origen, t.fecha_llegada_espana, t.fecha_llegada_nosotros,
            t.fecha_recepcion_almacen, t.anotaciones
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
        OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    """
    try:
        print("Executing exact query from purchases_cenvalsa.py...")
        df = pd.read_sql(text(query), engine, params=params)
        print("Success!")
        print(df.head())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug()
