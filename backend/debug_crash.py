from routers.production import get_production_operations
from database import SessionLocal
import pandas as pd

db = SessionLocal()
try:
    print("Testing get_production_operations(2026, 496)")
    # Mocking current_user since it's just for Depends
    class MockUser:
        is_active = True
    
    result = get_production_operations(exercise=2026, work_num=496, db=db, current_user=MockUser())
    print("Result Type:", type(result))
    if isinstance(result, list):
        print("Rows:", len(result))
    else:
        print("Error/Result:", result)
except Exception as e:
    print(f"CRASHED: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
