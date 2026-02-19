from database import SessionLocal
from routers.sales import get_sales_comparison, ComparisonFilters
import pandas as pd
from datetime import date

# Mock DB Session
db = SessionLocal()

# Test Filters: 2023 to 2026
filters = ComparisonFilters(
    start_year=2023,
    end_year=2026,
    division=None,
    sales_rep_id=None
)

print("Testing Comparison Query...")
try:
    result = get_sales_comparison(filters, db)
    print("Success!")
    print(f"Number of records: {len(result['comparison'])}")
    if result['comparison']:
        print("Sample record:", result['comparison'][0])
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
