import json
import os

layout_path = r"c:\Users\adrian.rubio\OneDrive - CENVAL S.L\Escritorio\repositorios\Data_Management\Almacen_PBIX\Report\Layout"
try:
    with open(layout_path, "r", encoding="utf-16-le") as f:
        data = json.load(f)

    for section in data.get('sections', []):
        print(f"Page: {section.get('displayName')}")
        for visual in section.get('visualContainers', []):
            try:
                config = json.loads(visual.get('config', '{}'))
                vtype = config.get('singleVisual', {}).get('visualType')
                if vtype:
                    print("  Type:", vtype)
                    projs = config.get('singleVisual', {}).get('projections', {})
                    for key, val in projs.items():
                        cols = [v.get('queryRef') for v in val]
                        print(f"    {key}: {cols}")
            except Exception as e:
                pass
except Exception as e:
    print("Error reading Layout:", e)
