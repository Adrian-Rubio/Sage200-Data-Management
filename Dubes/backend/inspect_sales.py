from database import engine
import sqlalchemy as sa
import datetime

md = sa.MetaData()
md.reflect(bind=engine)
sales = md.tables['Sales']
tickets = md.tables['Tickets']

with engine.connect() as conn:
    print("Sales columns:", [c.name for c in sales.columns])
    
    # Check distinct fields that might separate restaurants
    res = conn.execute(sa.text("SELECT TOP 500 * FROM Sales ORDER BY CheckOutDate DESC")).fetchall()
    
    keys_to_check = ['CashRegisterId', 'DocumentTypeId', 'EmployeeId', 'PaymentMethodId', 'SessionId']
    
    for row in res:
        pass # just to fetch
    
    # Let's see unique CashRegisters
    if 'CashRegisterId' in sales.columns:
        t = conn.execute(sa.text("SELECT DISTINCT CashRegisterId FROM Sales")).fetchall()
        print("\nDistinct CashRegisters:", t)
        
    # Let's see unique Sale series or something
    if 'SerieId' in sales.columns:
        t = conn.execute(sa.text("SELECT DISTINCT SerieId FROM Sales")).fetchall()
        print("\nDistinct Series:", t)
