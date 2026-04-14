from database import SessionLocal
from routers.inventory_tracking import get_article_price_history

db = SessionLocal()
try:
    # Just picking an arbitrary string or we can find one using search. 
    # Let's test if it crashes when empty.
    res = get_article_price_history("XX-TEST-XX", db, None)
    print("Empty code test:", res)
    
except Exception as e:
    print("Error:", e)
finally:
    db.close()
