import pandas as pd
df = pd.read_excel('../Presupuestos por cliente.xlsx', header=None)
d = df.iloc[2:]
headers = df.iloc[0].ffill()
subs = df.iloc[1].fillna('')

for i in range(len(headers)):
    if str(subs[i]).lower() == 'total':
        h = headers[i]
        s = pd.to_numeric(d[i], errors='coerce').sum()
        print(f"Index {i}: Header='{h}', Sum={s:,.2f}")
