import pandas as pd

temp_file = "c:/Users/adrian.rubio/OneDrive - CENVAL S.L/Escritorio/repositorios/Data_Management/scratch/temp_excel.xlsx"

try:
    df_scoring = pd.read_excel(temp_file, sheet_name="Scoring", header=None, nrows=5)
    print("Scoring Sheet (first 5 rows with header=None):")
    print(df_scoring.iloc[:, [0, 1, -2, -1]]) # Print code, desc, and the last two columns to see the score
except Exception as e:
    print(f"Error: {e}")
