import sys
sys.path.append('.')
from sqlalchemy import create_engine, text
from database import engine
import pandas as pd

with engine.connect() as conn:
    print("--- INVESTIGATION FOR JESUS COLLADO ARAQUE (FEB 2026) ---")
    
    # 1. PEDIDOS (Orders)
    q_pedidos = """
        SELECT SUM(lin.ImporteNeto) as Total
        FROM CabeceraPedidoCliente cab
        JOIN LineasPedidoCliente lin ON cab.CodigoEmpresa = lin.CodigoEmpresa AND cab.EjercicioPedido = lin.EjercicioPedido AND cab.SeriePedido = lin.SeriePedido AND cab.NumeroPedido = lin.NumeroPedido
        JOIN Comisionistas com ON cab.CodigoEmpresa = com.CodigoEmpresa AND cab.CodigoComisionista = com.CodigoComisionista
        WHERE cab.CodigoEmpresa = 2 AND cab.EjercicioPedido = 2026 AND MONTH(cab.FechaPedido) = 2
        AND com.Comisionista LIKE '%JESUS COLLADO%'
    """
    res_ped = conn.execute(text(q_pedidos)).fetchone()
    print(f"PEDIDOS (CabeceraPedidoCliente): {res_ped[0] if res_ped else 0}")

    # 2. FACTURADO (Invoiced) - Dashboard version
    q_fact = """
        SELECT SUM(BaseImponible) as Total
        FROM Vis_AEL_DiarioFactxComercial
        WHERE CodigoEmpresa = 2 AND YEAR(FechaFactura) = 2026 AND MONTH(FechaFactura) = 2
        AND Comisionista LIKE '%JESUS COLLADO%'
    """
    res_fact = conn.execute(text(q_fact)).fetchone()
    print(f"FACTURADO (Vis_AEL_DiarioFactxComercial): {res_fact[0] if res_fact else 0}")

    # 3. FACTURADO (Wait, maybe EjercicioPedido in reports is wrong?)
    # Jesus logic in reports.py uses Exercise as Filters.exercise. 
    # If the user selects Exercise 2026, Period 2.
    
    # Let's check if there are orders from 2025 invoiced in 2026 Feb.
    q_ped2 = """
        SELECT SUM(lin.ImporteNeto) as Total
        FROM CabeceraPedidoCliente cab
        JOIN LineasPedidoCliente lin ON cab.CodigoEmpresa = lin.CodigoEmpresa AND cab.EjercicioPedido = lin.EjercicioPedido AND cab.SeriePedido = lin.SeriePedido AND cab.NumeroPedido = lin.NumeroPedido
        JOIN Comisionistas com ON cab.CodigoEmpresa = com.CodigoEmpresa AND cab.CodigoComisionista = com.CodigoComisionista
        WHERE cab.CodigoEmpresa = 2 AND MONTH(cab.FechaPedido) = 2
        AND com.Comisionista LIKE '%JESUS COLLADO%'
    """
    # Note: reports.py filters by cab.EjercicioPedido = :ex
    # If user selected 2026, it only sees orders placed in 2026.
