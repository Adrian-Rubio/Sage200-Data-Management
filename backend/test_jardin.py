import pyodbc
import os
from dotenv import load_dotenv

# Cargar variables de entorno si existen
load_dotenv()

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
