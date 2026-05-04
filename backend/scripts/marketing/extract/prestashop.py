import os
import json
import urllib.request
import urllib.error
import urllib.parse
from dotenv import load_dotenv
from datetime import datetime

# Cargar variables de entorno
load_dotenv()

class PrestaShopExtractor:
    def __init__(self, name, url, key, custom_token=None):
        self.name = name
        self.url = url.rstrip('/')
        self.key = key
        self.custom_token = custom_token
        self.proxy_url = os.environ.get("PROXY_URL")
        
        # Configurar Proxy con Autenticación Explícita
        handlers = []
        if self.proxy_url:
            try:
                proxy_data = self.proxy_url.replace("http://", "").replace("https://", "")
                if "@" in proxy_data:
                    auth_part, host_part = proxy_data.split("@")
                    proxy_user, proxy_pass = auth_part.split(":")
                    
                    proxy_auth_handler = urllib.request.ProxyBasicAuthHandler()
                    proxy_auth_handler.add_password(None, host_part, proxy_user, proxy_pass)
                    handlers.append(proxy_auth_handler)
                    
                    proxy_handler = urllib.request.ProxyHandler({'http': self.proxy_url, 'https': self.proxy_url})
                    handlers.append(proxy_handler)
            except:
                handlers.append(urllib.request.ProxyHandler({'http': self.proxy_url, 'https': self.proxy_url}))
        
        self.opener = urllib.request.build_opener(*handlers)

    def fetch_json(self, resource, params=None):
        if params is None: params = {}
        all_params = {"ws_key": self.key, "output_format": "JSON", "display": "full"}
        all_params.update(params)
        query = urllib.parse.urlencode(all_params)
        url = f"{self.url}/{resource}?{query}"
        
        try:
            with self.opener.open(url, timeout=30) as response:
                if response.status == 200:
                    return json.loads(response.read().decode('utf-8'))
        except Exception as e:
            print(f"Error en API {self.name} ({resource}): {e}")
            return None

    def fetch_custom_data(self, action):
        if not self.custom_token: return []
        base_url = self.url.replace('/api', '')
        url = f"{base_url}/extractor_custom.php?token={self.custom_token}&action={action}"
        
        try:
            with self.opener.open(url, timeout=20) as response:
                if response.status == 200:
                    return json.loads(response.read().decode('utf-8'))
            return []
        except Exception as e:
            print(f"Error en Extractor Custom {self.name} ({action}): {e}")
            return []

    def get_data(self):
        print(f"--- Extrayendo {self.name} ---")
        customers_data = self.fetch_json("customers")
        customers = customers_data.get("customers", []) if customers_data else []
        
        products_data = self.fetch_json("products", params={"display": "[id,name]"})
        products_list = products_data.get("products", []) if products_data else []
        product_map = {str(p.get('id')): (p.get('name')[0].get('value') if isinstance(p.get('name'), list) else p.get('name')) for p in products_list}
        
        pdfs = self.fetch_custom_data("pdfs")
        quotes = self.fetch_custom_data("quotes")
        
        return {
            "store_name": self.name,
            "customers_count": len(customers), "pdfs_count": len(pdfs), "quotes_count": len(quotes),
            "product_names": product_map,
            "customers": [{"email": c.get("email"), "id": c.get("id")} for c in customers],
            "pdfs": pdfs, "quotes": quotes
        }

if __name__ == "__main__":
    # Prueba rápida
    pass
