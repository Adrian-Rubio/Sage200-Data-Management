import os
import sys
import pandas as pd
import shutil
import tempfile

def debug_excel():
    PROJECT_ROOT = ".."
    EXCEL = os.path.join(PROJECT_ROOT, "Presupuestos por cliente.xlsx")
    df = pd.read_excel(EXCEL, header=None)
    main = df.iloc[0].ffill()
    sub = df.iloc[1].fillna('')
    data = df.iloc[2:]
    
    months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
    
    unique_mains = main.unique()
    print(f"Main headers found: {unique_mains}")
    
    for m in unique_mains:
        if m in ['codcliente', 'cliente']: continue
        cols = [i for i in range(len(main)) if main[i] == m and str(sub[i]).lower() == 'mar']
        if cols:
            col_idx = cols[0]
            val_sum = pd.to_numeric(data[col_idx], errors='coerce').sum()
            print(f"Suma de '{m}' para MARZO: {val_sum:,.2f} €")

if __name__ == "__main__":
    debug_excel()
