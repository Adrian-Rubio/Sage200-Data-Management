import sys
import os

# Asegurar que el directorio actual está en el path para las importaciones
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from marketing.extract.mailchimp import MailchimpExtractor
from marketing.extract.prestashop import PrestaShopExtractor
from marketing.transform.consolidate import consolidate_data
from datetime import datetime
import json

def run_pipeline():
    print("=== INICIANDO PIPELINE DE DATOS COMPLETO ===")
    
    # 1. Extraer Mailchimp
    print("\n[EJECUTANDO] extract/mailchimp.py...")
    try:
        extractor_mc = MailchimpExtractor()
        extractor_mc.run_full_extraction()
        print("[OK] extract/mailchimp.py completado.")
    except Exception as e:
        print(f"[ERROR] Fallo en extract/mailchimp.py: {e}")

    # 2. Extraer PrestaShop
    print("\n[EJECUTANDO] extract/prestashop.py...")
    try:
        custom_token = os.environ.get("PS_CUSTOM_TOKEN")
        stores_config = [
            {"name": "CENVAL", "url": os.environ.get("PS_CENVAL_URL"), "key": os.environ.get("PS_CENVAL_KEY")},
            {"name": "CONEXCON", "url": os.environ.get("PS_CONEXCON_URL"), "key": os.environ.get("PS_CONEXCON_KEY")}
        ]
        
        all_data = {"last_updated": datetime.now().isoformat(), "stores": []}
        
        for s in stores_config:
            if s['url'] and s['key']:
                extractor_ps = PrestaShopExtractor(s['name'], s['url'], s['key'], custom_token)
                store_data = extractor_ps.get_data()
                all_data["stores"].append(store_data)

        os.makedirs(os.path.join("data", "marketing"), exist_ok=True)
        output_path = os.path.join("data", "marketing", "prestashop_data.json")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(all_data, f, indent=4, ensure_ascii=False)
        print(f"[OK] extract/prestashop.py completado.")
    except Exception as e:
        print(f"[ERROR] Fallo en extract/prestashop.py: {e}")

    # 3. Consolidar y Unificar
    print("\n[EJECUTANDO] transform/consolidate.py...")
    try:
        consolidate_data()
        print("[OK] transform/consolidate.py completado.")
    except Exception as e:
        print(f"[ERROR] Fallo en transform/consolidate.py: {e}")

    print("\n=== PIPELINE FINALIZADO ===")
    print("Ya puedes refrescar el dashboard en tu navegador.")

if __name__ == "__main__":
    run_pipeline()
