import os
import json
import requests
from dotenv import load_dotenv
from datetime import datetime

# Cargar variables de entorno
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'config', '.env'))

class MailchimpExtractor:
    def __init__(self):
        self.api_key = os.environ.get("MAILCHIMP_API_KEY")
        self.server = os.environ.get("MAILCHIMP_SERVER_PREFIX")
        self.base_url = f"https://{self.server}.api.mailchimp.com/3.0"
        self.session = requests.Session()
        self.session.trust_env = False
        self.session.auth = ("anystring", self.api_key)

    def fetch(self, endpoint, params=None):
        response = self.session.get(f"{self.base_url}/{endpoint}", params=params)
        if response.status_code == 200:
            return response.json()
        print(f"[ERROR] En {endpoint}: {response.status_code}")
        return None

    def run_full_extraction(self):
        print("[1/3] Extrayendo resumen de Audiencias...")
        audiences = self.fetch("lists")
        
        print("[2/3] Extrayendo Reportes de Campañas (ultimas 20)...")
        reports = self.fetch("reports", params={"count": 20, "sort_field": "send_time", "sort_dir": "DESC"})
        
        print("[3/3] Extrayendo estadisticas globales...")
        # Consolidamos los datos
        data_dump = {
            "last_updated": datetime.now().isoformat(),
            "audiences": audiences.get("lists", []) if audiences else [],
            "campaign_reports": reports.get("reports", []) if reports else []
        }

        # Guardar en data/
        os.makedirs("data", exist_ok=True)
        output_path = os.path.join("data", "mailchimp_data.json")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data_dump, f, indent=4, ensure_ascii=False)
        
        print(f"\n[EXITO] Datos guardados en {output_path}")
        print(f"- Audiencias extraidas: {len(data_dump['audiences'])}")
        print(f"- Reportes de campañas: {len(data_dump['campaign_reports'])}")

if __name__ == "__main__":
    extractor = MailchimpExtractor()
    extractor.run_full_extraction()
