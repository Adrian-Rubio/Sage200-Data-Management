import os
import pyodbc
from urllib.parse import quote_plus
from sqlalchemy import create_engine, text
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_connections():
    possible_ips = ["10.0.8.2", "10.0.8.3", "10.0.8.5", "127.0.0.1"]
    db_name = "MisstipsiPro"
    db_user = "TpvReadOnly"
    db_pass = "98cxMs}xV>bDzD@Y"
    
    results = {}

    for ip in possible_ips:
        servers = [f"{ip}\\Misstipsi", ip]
        drivers = ["ODBC Driver 17 for SQL Server"]
        
        ip_success = False
        for server in servers:
            if ip_success: break
            for driver in drivers:
                try:
                    logger.info(f"Probando conexión a {server} usando {driver}...")
                    params = quote_plus(
                        f"DRIVER={{{driver}}};SERVER={server};DATABASE={db_name};UID={db_user};PWD={db_pass};Connect Timeout=3;TrustServerCertificate=yes;Encrypt=no;"
                    )
                    url = f"mssql+pyodbc:///?odbc_connect={params}"
                    engine = create_engine(url)
                    
                    with engine.connect() as conn:
                        res = conn.execute(text("SELECT Name FROM Locals")).fetchone()
                        local_name = res[0] if res else "Desconocido"
                        logger.info(f"¡ÉXITO! Conectado a {server}. Local: {local_name}")
                        results[ip] = {"status": "success", "local": local_name, "server": server}
                        ip_success = True
                        break
                except Exception as e:
                    logger.warning(f"Fallo en {server} ({driver}): {str(e)[:100]}")
        
        if not ip_success:
            results[ip] = {"status": "failed"}

    logger.info("\n--- RESUMEN DE CONEXIONES ---")
    for ip, info in results.items():
        if info["status"] == "success":
            print(f"✅ {ip}: {info['local']} ({info['server']})")
        else:
            print(f"❌ {ip}: No se pudo conectar")

if __name__ == "__main__":
    test_connections()
