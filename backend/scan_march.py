import pandas as pd
df = pd.read_excel('../Presupuestos por cliente.xlsx', header=None)
d = df.iloc[2:]
main = df.iloc[0].ffill()
sub = df.iloc[1].fillna('')

print("Column sums for March (sub_head == 'mar'):")
for i in range(len(df.columns)):
    if str(sub[i]).lower() == 'mar':
        s = pd.to_numeric(d[i], errors='coerce').sum()
        print(f"Col {i} ({main[i]}): {s:,.2f} €")
