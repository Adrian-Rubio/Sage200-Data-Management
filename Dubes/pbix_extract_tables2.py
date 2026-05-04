import json
import re

try:
    with open(r'c:\Users\adrian.rubio\OneDrive - CENVAL S.L\Escritorio\repositorios\Dubes\Gulah_unzipped\Report\Layout', 'r', encoding='utf-16-le') as f:
        data = json.load(f)
        json_str = json.dumps(data)
        
        query_refs = re.findall(r'"queryRef":\s*"([^"]+)"', json_str)
        tables = set()
        for ref in query_refs:
            if '.' in ref:
                tables.add(ref.split('.')[0])
        print("Tables from queryRefs:")
        for t in sorted(tables):
            print(f" - {t}")
            
except Exception as e:
    print("Error:", e)
