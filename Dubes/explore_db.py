import pyodbc
conn = pyodbc.connect(r'DRIVER={ODBC Driver 17 for SQL Server};SERVER=10.0.8.2\Misstipsi;DATABASE=MisstipsiPro;UID=TpvReadOnly;PWD=98cxMs}xV>bDzD@Y')
cursor = conn.cursor()

# Find tables with Map or Element
cursor.execute("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' AND (TABLE_NAME LIKE '%Map%' OR TABLE_NAME LIKE '%Element%')")
print('Tables:', cursor.fetchall())

# Check MapElement or similar
try:
    cursor.execute("SELECT TOP 5 Id, Name FROM MapElement")
    print('MapElement:', cursor.fetchall())
except Exception as e:
    print('MapElement error:', e)
    
# Let's also check SaleDetails description
cursor.execute("SELECT TOP 5 Description FROM SaleDetails WHERE Description IS NOT NULL")
print('SaleDetails Descriptions:', cursor.fetchall())
