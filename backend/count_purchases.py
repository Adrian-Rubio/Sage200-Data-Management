from database import engine
from sqlalchemy import text
import pandas as pd

def count_data():
    queries = [
        ("Cabeceras >= 2024", "SELECT COUNT(*) FROM CabeceraPedidoProveedor WHERE EjercicioPedido >= 2024"),
        ("Lineas >= 2024", "SELECT COUNT(*) FROM LineasPedidoProveedor WHERE EjercicioPedido >= 2024")
    ]
    
    for label, query in queries:
        try:
            res = engine.connect().execute(text(query)).fetchone()
            print(f"{label}: {res[0]}")
        except Exception as e:
            print(f"Error {label}: {e}")

if __name__ == "__main__":
    count_data()
