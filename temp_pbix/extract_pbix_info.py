import re
import sys

def analyze():
    filepath = r'c:\Users\adrian.rubio\OneDrive - CENVAL S.L\Escritorio\repositorios\Data_Management\temp_pbix\DataModel'
    try:
        with open(filepath, 'rb') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    text_ascii = content.decode('ascii', errors='ignore')
    text_utf16 = content.decode('utf-16le', errors='ignore')

    print("--- ASCII CONTEXT ---")
    contexts_t = re.findall(r'.{0,100}Tipo error.{0,100}', text_ascii, re.IGNORECASE)
    for c in list(set(contexts_t))[:10]:
        print(c.replace('\n', ' ').replace('\r', ' '))

    print("\n--- UTF-16 CONTEXT ---")
    contexts_t_16 = re.findall(r'.{0,100}Tipo error.{0,100}', text_utf16, re.IGNORECASE)
    for c in list(set(contexts_t_16))[:20]:
        print(c.replace('\n', ' ').replace('\r', ' '))
        
    print("\n--- Power Query (M) or SQL snippets ---")
    # Finding M language snippets that usually contain the source definitions
    m_snippets = re.findall(r'let\s+Origen.*?(?="|\Z)', text_utf16, re.IGNORECASE | re.DOTALL)
    for snippet in list(set(m_snippets))[:5]:
        print(snippet[:500] + "...")
        
    m_snippets_en = re.findall(r'let\s+Source.*?(?="|\Z)', text_utf16, re.IGNORECASE | re.DOTALL)
    for snippet in list(set(m_snippets_en))[:5]:
        print(snippet[:500] + "...")

if __name__ == '__main__':
    analyze()
