import pandas as pd
df = pd.read_excel('../Presupuestos por cliente.xlsx', header=None)
d = df.iloc[2:]
print(f"Col 28 sum: {pd.to_numeric(d[28], errors='coerce').sum():,.2f}")
print(f"Col 41 sum: {pd.to_numeric(d[41], errors='coerce').sum():,.2f}")
