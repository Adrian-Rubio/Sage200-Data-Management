import json
from database import SessionLocal
from routers.aprovisionamiento import get_forecast

def test_endpoint():
    db = SessionLocal()
    try:
        data = get_forecast(familia='C', year1=2024, year2=2025, months='1,2,3', db=db)
        with open("aprovisionamiento_test_out.json", "w", encoding="utf-8") as f:
            json.dump(data[:5], f, indent=4, ensure_ascii=False)
            
    except Exception as e:
        with open("aprovisionamiento_test_out.json", "w", encoding="utf-8") as f:
            f.write(str(e))
    finally:
        db.close()

if __name__ == "__main__":
    test_endpoint()
