import string
import re

def extract_strings(filename, min_length=4):
    with open(filename, 'rb') as f:
        data = f.read()
    
    # Extract ASCII strings
    ascii_pattern = re.compile(b'[ -~]{%d,}' % min_length)
    ascii_strings = [match.decode('ascii') for match in ascii_pattern.findall(data)]
    
    # Extract UTF-16LE strings (simple heuristic: look for chars followed by \x00)
    utf16_pattern = re.compile(b'(?:[ -~]\x00){%d,}' % min_length)
    utf16_strings = [match.decode('utf-16le') for match in utf16_pattern.findall(data)]
    
    with open('strings.txt', 'w', encoding='utf-8') as out:
        for s in ascii_strings:
            out.write(s + '\n')
        for s in utf16_strings:
            out.write(s + '\n')

extract_strings(r'temp_pbix\DataModel', 8)
