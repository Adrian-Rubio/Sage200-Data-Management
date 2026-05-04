import json
import re

try:
    with open(r'c:\Users\adrian.rubio\OneDrive - CENVAL S.L\Escritorio\repositorios\Dubes\Gulah_unzipped\Report\Layout', 'r', encoding='utf-16-le') as f:
        data = json.load(f)
        
        json_str = json.dumps(data)
        
        # Look for "Entity": "TableName" patterns
        entities = re.findall(r'"Entity":\s*"([^"]+)"', json_str)
        
        tables = set(entities)
        print("Tables referenced in PBIX:")
        for t in sorted(tables):
            if "Measure" not in t:
                print(f" - {t}")
            
except Exception as e:
    print("Error:", e)
