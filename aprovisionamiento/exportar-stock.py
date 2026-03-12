#!/usr/bin/env python3
"""
Script para exportar stock en tiempo real desde SQL Server (Sage 200)
A ejecutar como tarea programada en Ubuntu cada 15 minutos
"""

import pyodbc
import csv
import os
from datetime import datetime
from pathlib import Path

# ===== CONFIGURACIÓN =====
# Modifica estos valores según tu entorno
SQL_SERVER = "192.168.0.33"  # IP o nombre del servidor SQL Server
SQL_DATABASE = "Sage"   # Nombre de la base de datos Sage 200
SQL_USER = "cenval"          # Usuario SQL Server
SQL_PASSWORD = "Cenvalsa#104$"   # Contraseña

EMPRESA = 2              # Solo empresa 2
EJERCICIO = 2025         # Año actual
PERIODO = 99             # Stock en tiempo real

# Ruta donde guardar el CSV (debe ser accesible desde el servidor web)
OUTPUT_PATH = "/var/www/html/stock.csv"

# ===== FIN CONFIGURACIÓN =====

def exportar_stock():
    """Exporta stock actual a CSV desde SQL Server"""
    
    try:
        # Conexión a SQL Server
        connection_string = (
    'DRIVER={ODBC Driver 18 for SQL Server};'
    'SERVER=192.168.0.33;'
    'DATABASE=Sage;'
    'UID=cenval;'
    'PWD=Cenvalsa#104$;'
    'TrustServerCertificate=yes;'
)
        
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        
        # Consulta SQL para obtener stock actual
        query = """
        SELECT 
            CodigoArticulo,
            UnidadSaldo AS StockActual,
            CodigoAlmacen,
            PrecioMedio,
            FechaUltimaEntrada,
            FechaUltimaSalida
        FROM 
            AcumuladoStock
        WHERE 
            CodigoEmpresa = ?
            AND Ejercicio = ?
            AND Periodo = ?
            AND CodigoAlmacen = '001'  -- Almacén principal, ajusta si es necesario
        ORDER BY 
            CodigoArticulo
        """
        
        cursor.execute(query, (EMPRESA, EJERCICIO, PERIODO))
        
        # Obtener resultados
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
        
        # Escribir CSV
        Path(OUTPUT_PATH).parent.mkdir(parents=True, exist_ok=True)
        
        with open(OUTPUT_PATH, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=columns, delimiter=';')
            writer.writeheader()
            
            for row in rows:
                row_dict = dict(zip(columns, row))
                writer.writerow(row_dict)
        
        conn.close()
        
        # Log
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] ✅ Stock exportado correctamente. {len(rows)} artículos.")
        
        # Guardar log
        with open("/var/log/stock_export.log", "a") as log:
            log.write(f"[{timestamp}] Exportación exitosa. Registros: {len(rows)}\n")
        
    except pyodbc.Error as e:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        error_msg = f"[{timestamp}] ❌ Error de conexión SQL: {str(e)}\n"
        print(error_msg)
        
        with open("/var/log/stock_export.log", "a") as log:
            log.write(error_msg)
    
    except Exception as e:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        error_msg = f"[{timestamp}] ❌ Error: {str(e)}\n"
        print(error_msg)
        
        with open("/var/log/stock_export.log", "a") as log:
            log.write(error_msg)

if __name__ == "__main__":
    exportar_stock()
