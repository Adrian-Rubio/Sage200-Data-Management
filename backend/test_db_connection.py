from database import engine
from sqlalchemy import text
import sys

def test_connection():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("DATABASE CONNECTION SUCCESSFUL")
            return True
    except Exception as e:
        print(f"DATABASE CONNECTION FAILED: {str(e)}")
        # Print more details if available
        if hasattr(e, 'orig'):
            print(f"Original Error: {e.orig}")
        return False

if __name__ == "__main__":
    if test_connection():
        sys.exit(0)
    else:
        sys.exit(1)
