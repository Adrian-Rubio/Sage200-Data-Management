import re

def parse_layout_raw():
    filepath = r'c:\Users\adrian.rubio\OneDrive - CENVAL S.L\Escritorio\repositorios\Data_Management\temp_pbix\Report\Layout'
    try:
        with open(filepath, 'rb') as f:
            data = f.read()
            text = data.decode('utf-16le', errors='ignore')
            
            # Simple regex for words
            matches = re.findall(r'.{0,50}Tipo error.{0,50}', text, re.IGNORECASE)
            print("--- Tipo error ---")
            for m in list(set(matches)):
                print(m.replace('\n', ' ').replace('\r', ' '))
                
            matches2 = re.findall(r'.{0,50}Razon.{0,50}', text, re.IGNORECASE)
            print("\n--- Razon ---")
            for m in list(set(matches2)):
                if 'RazonSocial' not in m:
                    print(m.replace('\n', ' ').replace('\r', ' '))
                    
            tables = re.findall(r'"Entity":\s*"([^"]+)"', text)
            print("\n--- Entities ---")
            print(list(set(tables)))
            
    except Exception as e:
        print(f"Error: {e}")

parse_layout_raw()
