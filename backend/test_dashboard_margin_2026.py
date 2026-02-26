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
        filters = DashboardFilters(start_date='2026-01-31', end_date='2026-02-27')
        user = MockUser()
        
        res = get_sales_dashboard(filters, db, user)
        print("Revenue:", res['kpis']['revenue'])
        print("Margin KPI:", res['kpis']['sales_margin'])
        print("Margin Chart:", res['charts']['sales_margin_evolution'])
    except Exception as e:
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == '__main__':
    test_full_dashboard()
