def fast_search():
    filepath = r'c:\Users\adrian.rubio\OneDrive - CENVAL S.L\Escritorio\repositorios\Data_Management\temp_pbix\DataModel'
    try:
        with open(filepath, 'rb') as f:
            data = f.read()
    except Exception as e:
        print(f"Error: {e}")
        return

    # Search for "Tipo error" in UTF-16LE
    search_str = "Tipo error".encode('utf-16le')
    search_str2 = "Razon".encode('utf-16le')
    search_str3 = "SELECT".encode('utf-16le')
    
    print("--- Tipo error ---")
    idx = 0
    found = 0
    while found < 5:
        idx = data.find(search_str, idx)
        if idx == -1: break
        start = max(0, idx - 400)
        end = min(len(data), idx + 800)
        snippet = data[start:end].decode('utf-16le', errors='ignore')
        print(snippet.replace('\n', ' ').replace('\r', ' '))
        print("...")
        idx += len(search_str)
        found += 1

    print("\n--- Razon ---")
    idx = 0
    found = 0
    while found < 5:
        idx = data.find(search_str2, idx)
        if idx == -1: break
        start = max(0, idx - 400)
        end = min(len(data), idx + 800)
        snippet = data[start:end].decode('utf-16le', errors='ignore')
        print(snippet.replace('\n', ' ').replace('\r', ' '))
        print("...")
        idx += len(search_str2)
        found += 1

fast_search()
