import pandas as pd
df = pd.read_excel('../Presupuestos por cliente.xlsx', header=None)
d = df.iloc[2:]
print(f"Col 2 (Sismecanic Total): {pd.to_numeric(d[2], errors='coerce').sum():,.2f}")
print(f"Col 15 (Conectores Total): {pd.to_numeric(d[15], errors='coerce').sum():,.2f}")
# Find where 'informatica' and 'total' columns are
headers = df.iloc[0].ffill()
for i, h in enumerate(headers):
    if h in ['informatica', 'total'] and df.iloc[1, i] == 'Total':
        print(f"Col {i} ({h} Total): {pd.to_numeric(d[i], errors='coerce').sum():,.2f}")
