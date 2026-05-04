import json
import re
import pprint

def parse_layout():
    with open(r'c:\Users\adrian.rubio\OneDrive - CENVAL S.L\Escritorio\repositorios\Dubes\Gulah_unzipped\Report\Layout', 'r', encoding='utf-16-le') as f:
        data = json.load(f)
    
    sections = data.get('sections', [])
    print(f"Total Pages: {len(sections)}")
    
    for section in sections:
        print(f"\n--- Page: {section.get('displayName')} ---")
        visualContainers = section.get('visualContainers', [])
        for vc in visualContainers:
            config_str = vc.get('config')
            if not config_str: continue
            try:
                config = json.loads(config_str)
                name = config.get('name', 'Unknown')
                singleVisual = config.get('singleVisual', {})
                visualType = singleVisual.get('visualType')
                
                projections = singleVisual.get('projections', {})
                if not projections: continue
                
                print(f"  Visual: {visualType} ({name})")
                
                # Projections usually map the visual role (e.g. Values, Axis) to a query ref
                for role, refs in projections.items():
                    queryRefs = [r.get('queryRef') for r in refs]
                    print(f"    Role '{role}': {queryRefs}")
            except Exception as e:
                pass

if __name__ == "__main__":
    parse_layout()
