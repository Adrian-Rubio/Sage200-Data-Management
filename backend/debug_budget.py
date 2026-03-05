# debug_budget.py
import pandas as pd
import re
import os

COMPANY_SHEET_MAP = {
    '100': 'Total grupo',
    '2': 'Cenvalsa industrial',
    '4': 'D&M',
    '6': 'Saratur'
}

def debug():
    file_path = "P&G Grupo Cenval 2026 v1.xlsx"
    if not os.path.exists(file_path):
        print(f"File {file_path} not found.")
        return

    xls = pd.ExcelFile(file_path)
    for company_id, sheet_name in COMPANY_SHEET_MAP.items():
        print(f"\n--- Checking {sheet_name} (ID: {company_id}) ---")
        if sheet_name not in xls.sheet_names:
            print(f"Sheet {sheet_name} NOT FOUND.")
            continue
            
        df = pd.read_excel(xls, sheet_name=sheet_name)
        desc_col = df.columns[0]
        
        matches_found = 0
        samples = []
        
        for idx, row in df.iterrows():
            desc = str(row[desc_col])
            # Replicate the regex in budget_parser.py
            match = re.match(r'^\s*(\d{6,10})', desc)
            if match:
                matches_found += 1
                if len(samples) < 5:
                    samples.append((match.group(1), desc[:30]))
            
        print(f"Regex matches found: {matches_found}")
        if samples:
            print("Sample matches:", samples)
        else:
            print("First 10 rows of Descripcion column:")
            print(df[desc_col].head(10).to_list())

if __name__ == "__main__":
    debug()
