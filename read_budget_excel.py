import pandas as pd
import sys

file_path = "P&G Grupo Cenval 2026 v1.xlsx"

try:
    xls = pd.ExcelFile(file_path)
    print("Sheets available:", xls.sheet_names)
    
    for sheet in xls.sheet_names:
        print(f"\n--- Sheet: {sheet} ---")
        df = pd.read_excel(xls, sheet_name=sheet, nrows=20)
        print(df.head(10))
        print("Columns:", df.columns.tolist())
    
except Exception as e:
    print(f"Error reading excel: {e}")
