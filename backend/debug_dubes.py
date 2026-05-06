from sqlalchemy import text
from database import SessionLocal
import datetime
import os
import sys

# Mock Dubes
sys.path.append(os.path.join(os.getcwd(), 'dubes'))
from dubes.database_cache import SessionLocal as DubesSession
from dubes.models import Sale

db = SessionLocal()
current_month = datetime.datetime.now().month
current_year = datetime.datetime.now().year

try:
    dubes_db = DubesSession()
    start_of_month = datetime.datetime(current_year, current_month, 1)
    res_rest = dubes_db.query(text("SUM(Total)")).select_from(Sale).filter(Sale.CheckOutDate >= start_of_month, Sale.IsDeleted == False).scalar()
    print(f"Restoration: {res_rest}")
    dubes_db.close()
except Exception as e:
    print(f"ERROR Dubes: {e}")

db.close()
