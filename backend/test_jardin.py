import pyodbc
import os
from dotenv import load_dotenv

# Cargar variables de entorno si existen
load_dotenv()

# Parche para permitir protocolos SSL antiguos (TLS 1.0/1.1)
base_dir = os.path.dirname(os.path.abspath(__file__))
openssl_conf = os.path.join(base_dir, "openssl_permissive.cnf")
if os.path.exists(openssl_conf):
    os.environ["OPENSSL_CONF"] = openssl_conf
    print(f"Configuración OpenSSL cargada: {openssl_conf}")

# Datos de El Jardín
server = "10.0.8.2"
db = "MisstipsiPro"
user = "TpvReadOnly"
password = "98cxMs}xV>bDzD@Y"

# Lista de drivers a probar en Linux
drivers = ["ODBC Driver 17 for SQL Server", "FreeTDS", "SQL Server"]
servers_to_try = [f"{server}\\Misstipsi", server]

print("--- DIAGNÓSTICO DE CONEXIÓN A EL JARDÍN ---")

for driver in drivers:
    for s in servers_to_try:
        print(f"\nProbando: {s} | Driver: {driver}")
        try:
            # Construir cadena de conexión
            if driver == "FreeTDS":
                # Para FreeTDS en Linux, a veces es mejor pasar el puerto y la versión de TDS
                server_only = s.split('\\')[0]
                conn_str = f"DRIVER={{FreeTDS}};SERVER={server_only};PORT=1433;DATABASE={db};UID={user};PWD={password};TDS_Version=7.0;Timeout=5;"
            else:
                conn_str = f"DRIVER={{{driver}}};SERVER={s};DATABASE={db};UID={user};PWD={password};Timeout=5;TrustServerCertificate=yes;Encrypt=no;"
            
            conn = pyodbc.connect(conn_str)
            print(">>> ¡CONECTADO CON ÉXITO! <<<")
            
            cursor = conn.cursor()
            cursor.execute("SELECT Name FROM Locals")
            row = cursor.fetchone()
            print(f"Nombre del Local en DB: {row[0]}")
            
            conn.close()
            # Si conecta, terminamos
            print("\nPrueba finalizada con éxito.")
            exit(0)
        except Exception as e:
            print(f"Error: {str(e)[:200]}")

print("\nNo se pudo conectar con ninguna combinación.")
