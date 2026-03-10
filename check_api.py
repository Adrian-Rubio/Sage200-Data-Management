import os
import re

api_file = r"c:\Users\adrian.rubio\OneDrive - CENVAL S.L\Escritorio\repositorios\Data_Management\frontend\src\services\api.js"
src_dir = r"c:\Users\adrian.rubio\OneDrive - CENVAL S.L\Escritorio\repositorios\Data_Management\frontend\src"

with open(api_file, 'r', encoding='utf-8') as f:
    api_content = f.read()

exports = re.findall(r'export const (\w+)', api_content)
print(f"Exports found in api.js: {len(exports)}")

imports = set()
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.jsx'):
            with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                content = f.read()
                # Find imports from services/api
                match = re.search(r"import \{([^}]+)\} from '.*services/api'", content)
                if match:
                    items = [i.strip() for i in match.group(1).split(',')]
                    for item in items:
                        if item:
                            imports.add(item)

missing = sorted([i for i in imports if i not in exports])
print(f"Missing exports: {missing}")
