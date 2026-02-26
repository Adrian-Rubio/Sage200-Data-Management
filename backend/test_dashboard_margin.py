import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from routers.sales import get_sales_dashboard, DashboardFilters

class MockUser:
    def __init__(self):
        self.role = 'admin'
        self.sales_rep_id = None
        self.role_obj = None

def test_full_dashboard():
    db = SessionLocal()
    try:
        filters = DashboardFilters(start_date='2025-02-01', end_date='2025-03-31')
        user = MockUser()
        
        res = get_sales_dashboard(filters, db, user)
        print("Margin KPI:", res['kpis']['sales_margin'])
        print("Margin Chart length:", len(res['charts']['sales_margin_evolution']))
        if res['charts']['sales_margin_evolution']:
            print("First margin chart data:", res['charts']['sales_margin_evolution'][0])
    except Exception as e:
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == '__main__':
    test_full_dashboard()
