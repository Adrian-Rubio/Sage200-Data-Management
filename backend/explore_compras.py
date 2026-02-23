from database import engine
import pandas as pd
from sqlalchemy import text

def explore_compras():
    print("--- Explorando CabeceraPedidoProveedor ---")
    query_cabecera = """
        SELECT TOP 5 
            CodigoEmpresa, EjercicioPedido, SeriePedido, NumeroPedido, FechaPedido,
            CodigoProveedor, RazonSocial,
            _AEL_OrigenPedido, _AEL_EjercicioPedOrigen, _AEL_SeriePedOrigen, _AEL_NumeroPedOrigen, StatusEstadis, Estado
        FROM CabeceraPedidoProveedor
        WHERE _AEL_NumeroPedOrigen IS NOT NULL AND _AEL_NumeroPedOrigen != '' AND _AEL_NumeroPedOrigen != '0'
        ORDER BY FechaPedido DESC
    """
    try:
        df_cab = pd.read_sql(text(query_cabecera), engine)
        print("Pedidos Hijos encontrados:")
        print(df_cab.to_string())
    except Exception as e:
        print(f"Error querying Cabecera: {e}")

    print("\n--- Explorando LineasPedidoProveedor ---")
    query_lineas = """
        SELECT TOP 5
            CodigoEmpresa, EjercicioPedido, SeriePedido, NumeroPedido, Orden,
            CodigoArticulo, DescripcionArticulo, UnidadesPedidas, UnidadesRecibidas, UnidadesPendientes,
            _AEL_LineaPadre, _AEL_UnidadesOriginal, Estado
        FROM LineasPedidoProveedor
        WHERE _AEL_LineaPadre IS NOT NULL
        ORDER BY FechaRegistro DESC
    """
    try:
        df_lin = pd.read_sql(text(query_lineas), engine)
        print("Lineas con LineaPadre:")
        print(df_lin.to_string())
    except Exception as e:
        print(f"Error querying Lineas: {e}")

if __name__ == "__main__":
    explore_compras()
