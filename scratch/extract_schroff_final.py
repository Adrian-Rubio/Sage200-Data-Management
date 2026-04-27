import pandas as pd
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# Load env from backend folder
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

SERVER = os.getenv("DB_SERVER")
DATABASE = os.getenv("DB_DATABASE")
USER = os.getenv("DB_USER")
PASSWORD = os.getenv("DB_PASSWORD")
DRIVER = os.getenv("DB_DRIVER")

# Connection string
conn_str = f"mssql+pyodbc://{USER}:{PASSWORD}@{SERVER}/{DATABASE}?driver={DRIVER}&TrustServerCertificate=yes"
engine = create_engine(conn_str)

def generate_report():
    print(f"Generando reporte interactivo para SCHROFF (10001) en {DATABASE}...")
    
    with engine.connect() as conn:
        # 1. Base Articles for Schroff
        query_art = """
        SELECT 
            a.CodigoArticulo, 
            a.DescripcionArticulo,
            a.CodigoFamilia,
            a.CodigoSubfamilia,
            a.StockMinimo, 
            a.StockMaximo,
            a.PuntoPedido,
            a.CE_UnidadesEnvase as Unid_Envase,
            a.CE_EnvasesPorCaja as Env_Caja,
            a.CP_CE_Ubicacion as Ubicacion,
            a.PrecioCompra as Precio_Teorico
        FROM Articulos a
        WHERE a.CodigoProveedor = '10001' AND a.CodigoEmpresa = '2'
        """
        df_art = pd.read_sql(text(query_art), conn)
        
        if df_art.empty:
            print("No se encontraron artículos asignados directamente a 10001.")
            # Search in ArticuloProveedor
            query_art_alt = """
            SELECT DISTINCT CodigoArticulo 
            FROM ArticuloProveedor 
            WHERE CodigoProveedor = '10001' AND CodigoEmpresa = '2'
            """
            alt_codes = pd.read_sql(text(query_art_alt), conn)['CodigoArticulo'].tolist()
            if not alt_codes:
                print("Tampoco hay registros en ArticuloProveedor. Abortando.")
                return
            
            # Re-query with those codes
            codes_str = "', '".join(alt_codes)
            query_art = f"""
            SELECT 
                a.CodigoArticulo, a.DescripcionArticulo, a.CodigoFamilia, a.CodigoSubfamilia,
                a.StockMinimo, a.StockMaximo, a.PuntoPedido,
                a.CE_UnidadesEnvase as Unid_Envase, a.CE_EnvasesPorCaja as Env_Caja,
                a.CP_CE_Ubicacion as Ubicacion, a.PrecioCompra as Precio_Teorico
            FROM Articulos a
            WHERE a.CodigoArticulo IN ('{codes_str}') AND a.CodigoEmpresa = '2'
            """
            df_art = pd.read_sql(text(query_art), conn)

        print(f"Procesando {len(df_art)} artículos.")

        # 2. Current Stock (AcumuladoStock - Last period of 2026 or Current)
        query_stock = """
        SELECT 
            CodigoArticulo, 
            SUM(UnidadSaldo) as Stock_Actual
        FROM AcumuladoStock
        WHERE CodigoEmpresa = '2' AND Ejercicio = 2026 AND Periodo <= MONTH(GETDATE())
        GROUP BY CodigoArticulo
        """
        df_stock = pd.read_sql(text(query_stock), conn)

        # 3. Movements (2025 and 2026)
        query_mov = """
        SELECT 
            CodigoArticulo,
            YEAR(Fecha) as Year,
            SUM(CASE WHEN TipoMovimiento IN (1, 2) THEN Unidades ELSE 0 END) as Entradas,
            SUM(CASE WHEN TipoMovimiento IN (3, 4) THEN Unidades ELSE 0 END) as Salidas
        FROM MovimientoStock
        WHERE CodigoEmpresa = '2' AND YEAR(Fecha) IN (2025, 2026)
        GROUP BY CodigoArticulo, YEAR(Fecha)
        """
        df_mov_raw = pd.read_sql(text(query_mov), conn)
        
        # Pivot movements
        df_mov_pivot = df_mov_raw.pivot(index='CodigoArticulo', columns='Year', values=['Entradas', 'Salidas']).fillna(0)
        df_mov_pivot.columns = [f"{col[0]}_{col[1]}" for col in df_mov_pivot.columns]
        df_mov_pivot = df_mov_pivot.reset_index()

        # 4. Final Merge
        final_df = pd.merge(df_art, df_stock, on='CodigoArticulo', how='left')
        final_df = pd.merge(final_df, df_mov_pivot, on='CodigoArticulo', how='left')
        
        # Fill NaN
        final_df = final_df.fillna(0)

        # 5. Export
        output_file = r"c:\Users\adrian.rubio\OneDrive - CENVAL S.L\Escritorio\repositorios\Data_Management\Reporte_SCHROFF_Audit_2025_2026.xlsx"
        final_df.to_excel(output_file, index=False)
        print(f"Reporte generado exitosamente: {output_file}")

if __name__ == "__main__":
    generate_report()
