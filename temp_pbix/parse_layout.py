import json

def parse_layout():
    filepath = r'c:\Users\adrian.rubio\OneDrive - CENVAL S.L\Escritorio\repositorios\Data_Management\temp_pbix\Report\Layout'
    try:
        with open(filepath, 'rb') as f:
            data = f.read()
            # PBIX Layout is often utf-16-le
            text = data.decode('utf-16le', errors='ignore')
            # The start of JSON might have a BOM or non-json prefix. Find '{'
            start_idx = text.find('{')
            if start_idx != -1:
                text = text[start_idx:]
            
            layout = json.loads(text)
            
            # recursive search for Query or Expression to find table and column
            def find_columns(obj):
                cols = set()
                if isinstance(obj, dict):
                    for k, v in obj.items():
                        if k == "Property" and isinstance(v, str):
                            cols.add(v)
                        elif k == "Entity" and isinstance(v, str):
                            cols.add(f"TABLE: {v}")
                        elif k == "Name" and isinstance(v, str) and "." in v:
                            cols.add(v)
                        else:
                            cols.update(find_columns(v))
                elif isinstance(obj, list):
                    for item in obj:
                        cols.update(find_columns(item))
                return cols

            columns = find_columns(layout)
            
            print("--- Referenced Tables and Columns in Layout ---")
            for c in sorted(columns):
                if 'error' in c.lower() or 'razon' in c.lower() or 'table:' in c.lower() or 'motivo' in c.lower():
                    print(c)
                elif 'TABLE:' in c:
                    print(c)
                    
    except Exception as e:
        print(f"Error parsing layout: {e}")

parse_layout()
