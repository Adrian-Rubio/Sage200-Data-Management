import pyodbc
from dotenv import load_dotenv
import os

load_dotenv()

server = os.getenv('DB_SERVER')
database = os.getenv('DB_DATABASE')
username = os.getenv('DB_USER')
password = os.getenv('DB_PASSWORD')
driver = '{ODBC Driver 17 for SQL Server}'

conn_str = f"DRIVER={driver};SERVER={server};DATABASE={database};UID={username};PWD={password}"
conn = pyodbc.connect(conn_str)
cursor = conn.cursor()

print("=== CONTRASTE DE DATOS: EMPRESA 2 ===")

# 1. CLIENTES
try:
    cursor.execute("""
        SELECT 
            SUM(Contaje) as TotalPedidos,
            SUM(ATiempo) as PedidosATiempo,
            CAST(SUM(ATiempo) AS FLOAT) / SUM(Contaje) * 100 as PorcentajeATiempo
        FROM CEN_PowerBI_KPI_Entregas_a_tiempo_cliente
        WHERE CodigoEmpresa = 2 AND EjercicioAlbaran <= 2025
    """)
    row = cursor.fetchone()
    print(f"CLIENTES (Empresa 2): Total={row[0]}, A_Tiempo={row[1]}, %={row[2]:.2f}%")
except Exception as e:
    print(f"Error CLIENTES: {e}")

# 2. PROVEEDORES (Using the view logic but filtering CodigoEmpresa=2)
try:
    cursor.execute("""
        SELECT 
            SUM(1) as TotalPedidos,
            SUM(IIF((DATEDIFF(day, CabeceraAlbaranProveedor.FechaAlbaran,
ISNULL(ISNULL(CabeceraPedidoProveedor.FechaRecepcion, CabeceraPedidoProveedor.FechaNecesaria), CabeceraPedidoProveedor.FechaPedido + 28))) >= 0, 1, 0)) as PedidosATiempo
        FROM CabeceraAlbaranProveedor 
        INNER JOIN CabeceraPedidoProveedor ON CabeceraPedidoProveedor.CodigoEmpresa = CabeceraAlbaranProveedor.CodigoEmpresa 
            AND CabeceraPedidoProveedor.EjercicioPedido = CabeceraAlbaranProveedor.EjercicioPedido 
            AND CabeceraPedidoProveedor.NumeroPedido = CabeceraAlbaranProveedor.NumeroPedido 
            AND CabeceraPedidoProveedor.SeriePedido = CabeceraAlbaranProveedor.SeriePedido
        WHERE CabeceraPedidoProveedor._AEL_OrigenPedido <> 'PADRE'
          AND CabeceraAlbaranProveedor.CodigoEmpresa = 2
          AND CabeceraAlbaranProveedor.EjercicioAlbaran <= 2025
    """)
    row = cursor.fetchone()
    if row[0]:
        pct = (row[1] / row[0]) * 100
        print(f"PROVEEDORES (Empresa 2): Total={row[0]}, A_Tiempo={row[1]}, %={pct:.2f}%")
    else:
        print("PROVEEDORES: Sin datos.")
except Exception as e:
    print(f"Error PROVEEDORES: {e}")

# 3. FABRICACION (Using the view logic but filtering CodigoEmpresa=2)
try:
    cursor.execute("""
        SELECT 
            SUM(1) as TotalPedidos,
            SUM(IIF(DATEDIFF(day, (OrdenesFabricacion.FechaFinalReal + 1), CabeceraPedidoCliente.FechaEntrega) >= 0, 1, 0)) as PedidosATiempo
        FROM OrdenesFabricacion 
        INNER JOIN EstadoPedidosClientes ON EstadoPedidosClientes.CodigoEmpresa = OrdenesFabricacion.CodigoEmpresa 
            AND EstadoPedidosClientes.IdOFabricacion = OrdenesFabricacion.Identificador 
        INNER JOIN CabeceraPedidoCliente ON CabeceraPedidoCliente.CodigoEmpresa = EstadoPedidosClientes.CodigoEmpresa 
            AND CabeceraPedidoCliente.SeriePedido = EstadoPedidosClientes.SeriePedido 
            AND CabeceraPedidoCliente.NumeroPedido = EstadoPedidosClientes.NumeroPedido 
            AND CabeceraPedidoCliente.EjercicioPedido = EstadoPedidosClientes.EjercicioPedido
        WHERE OrdenesFabricacion.EstadoOF = 2
          AND OrdenesFabricacion.CodigoEmpresa = 2
          AND OrdenesFabricacion.EjercicioFabricacion <= 2025
    """)
    row = cursor.fetchone()
    if row[0]:
        pct = (row[1] / row[0]) * 100
        print(f"FABRICACION (Empresa 2): Total={row[0]}, A_Tiempo={row[1]}, %={pct:.2f}%")
    else:
        print("FABRICACION: Sin datos.")
except Exception as e:
    print(f"Error FABRICACION: {e}")

conn.close()
