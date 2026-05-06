import sqlite3
import datetime

db_path = "backend/dubes/misstipsi_cache.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Ayer
yesterday = (datetime.datetime.now() - datetime.timedelta(days=1)).strftime("%Y-%m-%d")
# Hoy
today = datetime.datetime.now().strftime("%Y-%m-%d")

print(f"Buscando datos para Ayer ({yesterday}) y Hoy ({today})...")

cursor.execute("SELECT SUM(TotalSalesAmount) FROM Sales WHERE date(CheckOutDate) = ?", (yesterday,))
res = cursor.fetchone()
print(f"Ventas Ayer: {res[0] if res else 0}")

cursor.execute("SELECT SUM(TotalSalesAmount) FROM Sales WHERE date(CheckOutDate) = ?", (today,))
res = cursor.fetchone()
print(f"Ventas Hoy: {res[0] if res else 0}")

cursor.execute("SELECT Name, COUNT(*) FROM Locals JOIN Maps ON Locals.Id = Maps.LocalId JOIN Elements ON Maps.Id = Elements.MapId JOIN Sales ON Elements.Id = Sales.ElementId GROUP BY Name")
print("\nVentas por Local (Total histórico en caché):")
for row in cursor.fetchall():
    print(f"{row[0]}: {row[1]}")

conn.close()
