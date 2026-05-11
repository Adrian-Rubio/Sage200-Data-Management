
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv
import pandas as pd

load_dotenv()
SQLALCHEMY_DATABASE_URL = f"mssql+pyodbc://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_SERVER')}/{os.getenv('DB_DATABASE')}?driver={os.getenv('DB_DRIVER')}&TrustServerCertificate=yes"
engine = create_engine(SQLALCHEMY_DATABASE_URL)

query_base = """
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
    WHERE c.CodigoEmpresa = 2 AND c.Estado < 2
"""

data_query = f"""
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
    {query_base}
    ORDER BY FechaPedidoPadre DESC
    OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
"""

params = {"offset": 0, "limit": 50}

try:
    with engine.connect() as conn:
        print("Executing data query...")
        df = pd.read_sql(text(data_query), conn, params=params)
        print(f"Result size: {len(df)}")
        if len(df) > 0:
            print("Columns:")
            print(df.columns.tolist())
            print("First row:")
            print(df.iloc[0].to_dict())
except Exception as e:
    import traceback
    print(f"Error: {e}")
    traceback.print_exc()
