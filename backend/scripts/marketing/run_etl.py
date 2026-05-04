import pandas as pd
import json
import os
from extract.meta import get_meta_leads
from extract.prestashop import get_prestashop_orders

def run_etl():
    print("--- Iniciando ETL Marketing ---")
    
    # 1. Extracción
    df_leads = get_meta_leads()
    df_orders = get_prestashop_orders()
    
    # 2. Guardar en Staging (Parquet)
    if not os.path.exists('data/staging'): os.makedirs('data/staging')
    df_leads.to_parquet('data/staging/meta_leads.parquet', index=False)
    df_orders.to_parquet('data/staging/prestashop_orders.parquet', index=False)
    
    # 3. Transformación simple (Cruce por email)
    # Convertimos a minúsculas para el cruce
    df_leads['email'] = df_leads['email'].str.lower()
    df_orders['email'] = df_orders['email'].str.lower()
    
    # Unimos para ver qué leads terminaron en compra
    df_merged = pd.merge(df_leads, df_orders, on='email', how='left', suffixes=('_lead', '_order'))
    
    # 4. Guardar Core Data
    if not os.path.exists('data/core'): os.makedirs('data/core')
    df_merged.to_parquet('data/core/consolidated_marketing.parquet', index=False)
    
    # 5. Exportar a JSON para la Web (Demo)
    # Creamos un resumen para las gráficas
    summary = {
        'total_leads': len(df_leads),
        'total_orders': len(df_orders),
        'conversion_rate': f"{(len(df_merged[df_merged['order_id'].notnull()]) / len(df_leads) * 100):.2f}%",
        'recent_activity': df_merged.fillna('').to_dict(orient='records')
    }
    
    with open('web/data.json', 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=4, ensure_ascii=False)
        
    print("--- ETL Finalizado con éxito ---")
    print("Datos exportados a web/data.json")

if __name__ == "__main__":
    run_etl()
