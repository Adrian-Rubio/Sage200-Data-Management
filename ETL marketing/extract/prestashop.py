import os
import json
import requests
from dotenv import load_dotenv
from datetime import datetime

# Cargar variables de entorno
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'config', '.env'))

class PrestaShopExtractor:
    def __init__(self, name, url, key, custom_token=None):
        self.name = name
        self.url = url.rstrip('/')
        self.key = key
        self.custom_token = custom_token
        self.session = requests.Session()
        self.session.trust_env = False

    def fetch_json(self, resource, params=None):
        if params is None:
            params = {}
        params.update({
            "ws_key": self.key,
            "output_format": "JSON",
            "display": "full"
        })
        try:
            response = self.session.get(f"{self.url}/{resource}", params=params, timeout=30)
            if response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            print(f"Error en API {self.name} ({resource}): {e}")
            return None

    def fetch_custom_data(self, action):
        if not self.custom_token:
            return []
        base_url = self.url.replace('/api', '')
        custom_url = f"{base_url}/extractor_custom.php"
        params = {"token": self.custom_token, "action": action}
        try:
            response = self.session.get(custom_url, params=params, timeout=20)
            if response.status_code == 200:
                return response.json()
            return []
        except Exception as e:
            print(f"Error en Extractor Custom {self.name} ({action}): {e}")
            return []

    def get_data(self):
        print(f"\n--- Extrayendo datos de {self.name} ---")
        
        # 1. Clientes
        print(f" > Cargando clientes...")
        customers_data = self.fetch_json("customers")
        customers = customers_data.get("customers", []) if customers_data else []
        
        # 2. Productos (Para tener los nombres)
        print(f" > Cargando nombres de productos...")
        products_data = self.fetch_json("products", params={"display": "[id,name]"})
        products_list = products_data.get("products", []) if products_data else []
        # Crear un mapa id -> nombre
        product_map = {}
        for p in products_list:
            name = p.get('name')
            if isinstance(name, list): name = name[0].get('value') # Manejo de idiomas
            product_map[str(p.get('id'))] = name
        
        # 3. PDFs Descargados (Custom)
        print(f" > Cargando historial de PDFs...")
        pdfs = self.fetch_custom_data("pdfs")
        
        # 4. Presupuestos (Custom)
        print(f" > Cargando presupuestos...")
        quotes = self.fetch_custom_data("quotes")
        
        return {
            "store_name": self.name,
            "customers_count": len(customers),
            "pdfs_count": len(pdfs),
            "quotes_count": len(quotes),
            "product_names": product_map,
            "customers": [{"email": c.get("email"), "id": c.get("id")} for c in customers],
            "pdfs": pdfs,
            "quotes": quotes
        }

if __name__ == "__main__":
    custom_token = os.environ.get("PS_CUSTOM_TOKEN")
    stores_config = [
        {"name": "CENVAL", "url": os.environ.get("PS_CENVAL_URL"), "key": os.environ.get("PS_CENVAL_KEY")},
        {"name": "CONEXCON", "url": os.environ.get("PS_CONEXCON_URL"), "key": os.environ.get("PS_CONEXCON_KEY")}
    ]
    
    all_data = {"last_updated": datetime.now().isoformat(), "stores": []}
    
    for s in stores_config:
        if s['url'] and s['key']:
            extractor = PrestaShopExtractor(s['name'], s['url'], s['key'], custom_token)
            store_data = extractor.get_data()
            all_data["stores"].append(store_data)

    os.makedirs("data", exist_ok=True)
    output_path = os.path.join("data", "prestashop_data.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_data, f, indent=4, ensure_ascii=False)
    print(f"\n[EXITO] Datos con nombres de productos en {output_path}")
