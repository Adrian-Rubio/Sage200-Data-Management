import pandas as pd
import shutil
import os

# Paths
original_file = r"c:\Users\adrian.rubio\OneDrive - CENVAL S.L\Escritorio\repositorios\Data_Management\Listado articulos con stock 16-04-2026 con scoring y obsoleto.xlsx"
temp_file = r"c:\Users\adrian.rubio\OneDrive - CENVAL S.L\Escritorio\repositorios\Data_Management\scratch\temp_processing.xlsx"
output_file = r"c:\Users\adrian.rubio\OneDrive - CENVAL S.L\Escritorio\repositorios\Data_Management\Listado articulos procesado 16-04-2026.xlsx"

def process():
    print(f"--- Iniciando procesamiento de Excel ---")
    
    # 1. Copy to temp to avoid permission issues if open
    try:
        shutil.copy2(original_file, temp_file)
        print(f"Copia temporal creada.")
    except Exception as e:
        print(f"Error al copiar archivo: {e}")
        return

    try:
        # 2. Load Sheets
        print("Cargando hojas...")
        # Main Sheet
        df_main = pd.read_excel(temp_file, sheet_name="Listado articulos con stock 160")
        
        # Obsoletos Sheet
        # Based on previous inspection: it has columns ['División', 'Artículo', ...]
        df_obs = pd.read_excel(temp_file, sheet_name="Obsoleto")
        
        # Scoring Sheet
        # Based on previous inspection: no header, code in col 0, score in col 42
        df_scoring = pd.read_excel(temp_file, sheet_name="Scoring", header=None)

        # 3. Clean and Trim Codes
        print("Limpiando y normalizando códigos (Trim)...")
        
        # Convert to string and trim
        df_main['CodigoArticulo'] = df_main['CodigoArticulo'].astype(str).str.strip()
        
        # Articles in Obsoleto sheet are in column 'Artículo' (index 1 usually)
        obs_codes = set(df_obs['Art\u00edculo'].astype(str).str.strip().unique())
        
        # Scoring mapping: Code (col 0) -> Score (col 42)
        # Use col 42 as the score (A, B, C...)
        scoring_map = df_scoring.set_index(0)[42].to_dict()
        # Clean keys in scoring map
        scoring_map = {str(k).strip(): v for k, v in scoring_map.items()}

        # 4. Process Logic
        print("Ejecutando cruce de datos...")
        
        # Column 'Obsoleto' in main sheet
        df_main['Obsoleto'] = df_main['CodigoArticulo'].apply(lambda x: 'S\u00ed' if x in obs_codes else 'No')
        
        # Column 'Scoring' in main sheet
        df_main['Scoring'] = df_main['CodigoArticulo'].map(scoring_map)

        # 5. Save Output
        print(f"Guardando resultado en: {output_file}")
        df_main.to_excel(output_file, index=False)
        print("--- Proceso finalizado con éxito ---")

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error durante el procesamiento: {e}")
    finally:
        # Clean temp
        if os.path.exists(temp_file):
            os.remove(temp_file)

if __name__ == "__main__":
    process()
