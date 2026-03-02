import os
import sys
from dotenv import load_dotenv
import pandas as pd
import time

sys.path.append(r'c:\Users\adrian.rubio\OneDrive - CENVAL S.L\Escritorio\repositorios\Data_Management\backend')
load_dotenv(r'c:\Users\adrian.rubio\OneDrive - CENVAL S.L\Escritorio\repositorios\Data_Management\backend\.env')

from database import engine

def test_query():
    print("--- Testing Optimized Query ---")
    start_time = time.time()
    query = """
    WITH LineasAgg AS (
        SELECT 
            CodigoEmpresa, 
            EjercicioAlbaran, 
            NumeroAlbaran, 
            SUM(Unidades) as UnidadesTotales
        FROM LineasAlbaranCliente
        GROUP BY CodigoEmpresa, EjercicioAlbaran, NumeroAlbaran
    ),
    OpsClean AS (
        SELECT DISTINCT
            CodigoEmpresa,
            Operario,
            RTRIM(LTRIM(REPLACE(REPLACE(NombreOperario, CHAR(13), ''), CHAR(10), ''))) as NombreOperario
        FROM CE_OperariosAlmacen
    )
    SELECT 
        cab.EjercicioAlbaran,
        MONTH(cab.CE_FechaFinPrep) as Mes,
        DAY(cab.CE_FechaFinPrep) as Dia,
        CONVERT(VARCHAR(10), cab.CE_FechaFinPrep, 120) as Fecha,
        ISNULL(op.NombreOperario, 'Sin Asignar') as NombreOperario,
        cab.NumeroLineas,
        ISNULL(lin.UnidadesTotales, 0) as Unidades
    FROM CabeceraAlbaranCliente cab
    LEFT JOIN OpsClean op ON cab.CE_OperarioPreparacion = op.Operario AND cab.CodigoEmpresa = op.CodigoEmpresa
    LEFT JOIN LineasAgg lin ON cab.CodigoEmpresa = lin.CodigoEmpresa 
                         AND cab.EjercicioAlbaran = lin.EjercicioAlbaran 
                         AND cab.NumeroAlbaran = lin.NumeroAlbaran
    WHERE cab.CE_FechaFinPrep IS NOT NULL
    """
    try:
        df = pd.read_sql(query, engine)
        end_time = time.time()
        print(f"Query successful! Rows: {len(df)}. Time: {end_time - start_time:.2f}s")
        print(df.head())
        
        # Test grouping
        table_data = df.groupby(['Mes', 'Dia', 'NombreOperario']).agg({
            'NumeroLineas': 'sum',
            'Unidades': 'sum',
            'EjercicioAlbaran': 'count'
        }).reset_index()
        print("\nGrouping successful!")
        
    except Exception as e:
        print(f"QUERY ERROR: {str(e)}")

if __name__ == "__main__":
    test_query()
