import sys
import os
from datetime import date

# Add the current directory to sys.path to resolve imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db
from routers.sales import get_sales_dashboard, DashboardFilters

def debug_dashboard():
    try:
        db = next(get_db())
        filters = DashboardFilters(
            start_date=date(2023, 1, 1),
            end_date=date.today()
        )
        print("Testing dashboard query with default filters...")
        result = get_sales_dashboard(filters, db)
        print("Success!")
        print("KPIs:", result['kpis'])
    except Exception as e:
        print("Error occurred:")
        print(e)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_dashboard()
