
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

SERVER = os.getenv("DB_SERVER", "localhost")
DATABASE = os.getenv("DB_DATABASE")
USER = os.getenv("DB_USER")
PASSWORD = os.getenv("DB_PASSWORD")
DRIVER = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")

SQLALCHEMY_DATABASE_URL = f"mssql+pyodbc://{USER}:{PASSWORD}@{SERVER}/{DATABASE}?driver={DRIVER}&TrustServerCertificate=yes"
engine = create_engine(SQLALCHEMY_DATABASE_URL)

try:
    with engine.connect() as conn:
        print("Columns in purchase_tracking:")
        result = conn.execute(text("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'purchase_tracking'"))
        for row in result:
            print(row[0])
            
        print("\nTesting count query...")
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
        count_query = f"SELECT COUNT(*) {query_base}"
        count = conn.execute(text(count_query)).scalar()
        print(f"Count: {count}")
except Exception as e:
    print(f"Error: {e}")
