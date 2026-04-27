import pandas as pd
import shutil
import os

original_file = "c:/Users/adrian.rubio/OneDrive - CENVAL S.L/Escritorio/repositorios/Data_Management/Listado articulos con stock 16-04-2026 con scoring y obsoleto.xlsx"
temp_file = "c:/Users/adrian.rubio/OneDrive - CENVAL S.L/Escritorio/repositorios/Data_Management/scratch/temp_excel.xlsx"

try:
    shutil.copy2(original_file, temp_file)
    xls = pd.ExcelFile(temp_file)
    print("Sheet Names:", xls.sheet_names)
    
    for sheet in xls.sheet_names:
        print(f"\n--- Sheet: {sheet} ---")
        df = pd.read_excel(temp_file, sheet_name=sheet, nrows=5)
        print("Columns:", list(df.columns))
        print(df.head(2))
except Exception as e:
    print(f"Error: {e}")
