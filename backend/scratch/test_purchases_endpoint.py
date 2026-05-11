
from sqlalchemy import text
from database import SessionLocal
import routers.purchases_cenvalsa as purchases
from unittest.mock import MagicMock

def test():
    db = SessionLocal()
    try:
        print("Testing get_orders...")
        # Simulate current_user
        mock_user = MagicMock()
        
        # Test with default params
        try:
            result = purchases.get_orders(
                page=1,
                page_size=50,
                db=db,
                current_user=mock_user
            )
            print("get_orders successful")
            print(f"Total items: {result['total']}")
        except Exception as e:
            print(f"Error in get_orders: {e}")
            import traceback
            traceback.print_exc()
            
    finally:
        db.close()

if __name__ == "__main__":
    import os
    import sys
    sys.path.append(os.getcwd())
    test()
