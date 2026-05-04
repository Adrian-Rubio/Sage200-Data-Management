import json

try:
    with open(r'c:\Users\adrian.rubio\OneDrive - CENVAL S.L\Escritorio\repositorios\Dubes\Gulah_unzipped\Report\Layout', 'r', encoding='utf-16-le') as f:
        data = json.load(f)
        print("Sections/Pages in Report:")
        for section in data.get('sections', []):
            print(f" - {section.get('displayName')}")
            
except Exception as e:
    print("Error:", e)
