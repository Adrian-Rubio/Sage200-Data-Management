import pandas as pd
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# Load env from backend folder
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

SERVER = os.getenv("DB_SERVER", "localhost")
DATABASE = os.getenv("DB_DATABASE", "Sage") # Updated to 'Sage'
USER = os.getenv("DB_USER")
PASSWORD = os.getenv("DB_PASSWORD")
DRIVER = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")

# Connection string
conn_str = f"mssql+pyodbc://{USER}:{PASSWORD}@{SERVER}/{DATABASE}?driver={DRIVER}&TrustServerCertificate=yes"
engine = create_engine(conn_str)

def get_schroff_report():
    print(f"Iniciando extracción para SCHROFF (10001) en DB: {DATABASE}...")
    
    # Query for Articles with metadata
    query_articulos = """
    SELECT 
        a.CodigoArticulo, 
        a.DescripcionArticulo,
        a.StockMinimo, 
        a.StockMaximo,
        a.UnidadesPorEnvase,
        a.EnvasesPorCaja,
        a.Ubicacion,
        a.PuntoPedido,
        a.StockActual,
        a.UltimoPrecioCompra,
        prov.Nombre as NombreProveedor
    FROM Articulos a
    LEFT JOIN Proveedores prov ON a.CodigoProveedor = prov.CodigoProveedor AND a.CodigoEmpresa = prov.CodigoEmpresa
    WHERE a.CodigoProveedor = '10001' AND a.CodigoEmpresa = '2'
    """
    
    # Try to find the correct movements table (usually Movimientos or HistoricoMovimientos)
    # Using generic 'Movimientos' which is usually a view or current year table
    query_movements = """
    SELECT 
        m.CodigoArticulo,
        SUM(CASE WHEN m.TipoContable IN (1, 2) THEN m.Unidades ELSE 0 END) as Entradas_2025_2026,
        SUM(CASE WHEN m.TipoContable IN (3, 4) THEN m.Unidades ELSE 0 END) as Salidas_2025_2026,
        COUNT(*) as Total_Movimientos
    FROM Movimientos m
    WHERE m.CodigoEmpresa = '2' 
      AND YEAR(m.FechaMovimiento) IN (2025, 2026)
    GROUP BY m.CodigoArticulo
    """
    
    try:
        with engine.connect() as conn:
            print("Extrayendo base de artículos...")
            df_art = pd.read_sql(text(query_articulos), conn)
            
            if df_art.empty:
                print("AVISO: No se encontraron artículos para el proveedor 10001 en la empresa 2.")
                return

            print(f"Artículos encontrados: {len(df_art)}")
            
            print("Extrayendo movimientos 2025-2026...")
            try:
                df_mov = pd.read_sql(text(query_movements), conn)
            except Exception as mov_err:
                print(f"Error al leer Movimientos, probando HistoricoMovimientos: {mov_err}")
                query_movements_hist = query_movements.replace('Movimientos m', 'HistoricoMovimientos m')
                df_mov = pd.read_sql(text(query_movements_hist), conn)
            
            # Merge
            print("Cruzando datos...")
            final_df = pd.merge(df_art, df_mov, on='CodigoArticulo', how='left').fillna(0)
            
            output_path = r"c:\Users\adrian.rubio\OneDrive - CENVAL S.L\Escritorio\repositorios\Data_Management\Listado_SCHROFF_2025_2026.xlsx"
            final_df.to_excel(output_path, index=False)
            print(f"Reporte generado con éxito: {output_path}")
            
    except Exception as e:
        print(f"Error General: {e}")

if __name__ == "__main__":
    get_schroff_report()
