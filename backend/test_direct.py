from routers.home import get_home_summary
from database import SessionLocal
import models

db = SessionLocal()
user = db.query(models.User).first()

try:
    result = get_home_summary(db=db, current_user=user)
    print("SUCCESS")
    print(result)
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
