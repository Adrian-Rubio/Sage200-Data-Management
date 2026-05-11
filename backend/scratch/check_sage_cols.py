
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()
SQLALCHEMY_DATABASE_URL = f"mssql+pyodbc://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_SERVER')}/{os.getenv('DB_DATABASE')}?driver={os.getenv('DB_DRIVER')}&TrustServerCertificate=yes"
engine = create_engine(SQLALCHEMY_DATABASE_URL)

try:
    with engine.connect() as conn:
        print("Checking columns in CabeceraPedidoProveedor:")
        result = conn.execute(text("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CabeceraPedidoProveedor'"))
        cols = [row[0] for row in result]
        
        check_cols = ['CodigoEmpresa', 'EjercicioPedido', 'SeriePedido', 'NumeroPedido', 'FechaPedido', '_AEL_NumeroPedOrigen', '_AEL_EjercicioPedOrigen', '_AEL_SeriePedOrigen', 'RazonSocial', 'Nacion', 'Estado']
        for col in check_cols:
            print(f"{col}: {'EXISTS' if col in cols else 'MISSING'}")
except Exception as e:
    print(f"Error: {e}")
