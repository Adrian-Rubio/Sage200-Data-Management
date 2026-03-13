import pandas as pd
import shutil
import tempfile
import os
import json
import numpy as np

def parse_budget_excel():
    file_path = "c:/Users/adrian.rubio/OneDrive - CENVAL S.L/Escritorio/repositorios/Data_Management/Presupuestos por cliente.xlsx"
    
    try:
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, "temp_presupuestos.xlsx")
        shutil.copy2(file_path, temp_path)
        
        # Read the excel
        df = pd.read_excel(temp_path, sheet_name=0, header=None)
        
        # We know Row 0 has the main categories and Row 1 has the sub categories
        # Let's extract them
        main_headers = list(df.iloc[0].values)
        sub_headers = list(df.iloc[1].values)
        
        # Clean data: drop rows 0 and 1
        df_data = df.iloc[2:].copy()
        
        # The first two columns are codcliente and cliente
        df_data.rename(columns={0: 'client_code', 1: 'client_name'}, inplace=True)
        
        # Forward fill main headers so we know which division each column belongs to
        current_main = None
        for i in range(2, len(main_headers)):
            val = str(main_headers[i]).strip().lower()
            if val != 'nan' and len(val) > 0:
                current_main = val
            main_headers[i] = current_main
            
        parsed_data = []
        
        # Iterate over the first 5 rows to verify our parsing works
        for index, row in df_data.head(5).iterrows():
            client_code = row['client_code']
            client_name = row['client_name']
            
            # Skip empty rows
            if pd.isna(client_code) or pd.isna(client_name):
                continue
                
            client_budget = {
                "client_code": str(client_code),
                "client_name": str(client_name),
                "divisions": {}
            }
            
            # Extract division budgets
            for i in range(2, len(main_headers)):
                division = str(main_headers[i])
                sub_header = str(sub_headers[i]).strip().lower()
                
                # We skip 'nan' subheaders and divisions
                if division == 'none' or division == 'nan' or sub_header == 'nan':
                    continue
                    
                val = row[i]
                if pd.isna(val):
                    val = 0.0
                else:
                    try:
                        val = float(val)
                    except ValueError:
                        val = 0.0
                        
                if division not in client_budget["divisions"]:
                    client_budget["divisions"][division] = {}
                    
                # We probably only care about months (ene, feb...) and maybe total
                client_budget["divisions"][division][sub_header] = val
                
            parsed_data.append(client_budget)
            
        print(json.dumps(parsed_data, indent=2, ensure_ascii=False))
        
        # Clean up
        os.remove(temp_path)
        
    except Exception as e:
        print(f"Error reading excel: {e}")

if __name__ == "__main__":
    parse_budget_excel()
