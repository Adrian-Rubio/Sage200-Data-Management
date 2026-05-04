import os
import json
import urllib.request
import urllib.error
import base64
from dotenv import load_dotenv
from datetime import datetime

# Cargar variables de entorno
load_dotenv()

class MailchimpExtractor:
    def __init__(self):
        self.api_key = os.environ.get("MAILCHIMP_API_KEY")
        self.server = os.environ.get("MAILCHIMP_SERVER_PREFIX")
        self.proxy_url = os.environ.get("PROXY_URL")
        self.base_url = f"https://{self.server}.api.mailchimp.com/3.0"
        
        # Auth Mailchimp
        auth_str = f"anystring:{self.api_key}"
        self.auth_header = f"Basic {base64.b64encode(auth_str.encode()).decode()}"
        
        # Configurar Proxy con Autenticación Explícita
        handlers = []
        if self.proxy_url:
            # Intentar extraer user/pass del proxy_url
            try:
                # Formato esperado: http://user:pass@host:port
                proxy_data = self.proxy_url.replace("http://", "").replace("https://", "")
                if "@" in proxy_data:
                    auth_part, host_part = proxy_data.split("@")
                    proxy_user, proxy_pass = auth_part.split(":")
                    
                    # Creador de autenticación para el proxy
                    proxy_auth_handler = urllib.request.ProxyBasicAuthHandler()
                    proxy_auth_handler.add_password(None, host_part, proxy_user, proxy_pass)
                    handlers.append(proxy_auth_handler)
                    
                    # El handler del proxy propiamente dicho
                    proxy_handler = urllib.request.ProxyHandler({'http': self.proxy_url, 'https': self.proxy_url})
                    handlers.append(proxy_handler)
            except:
                # Si falla el parseo, usar el método simple
                handlers.append(urllib.request.ProxyHandler({'http': self.proxy_url, 'https': self.proxy_url}))
        
        self.opener = urllib.request.build_opener(*handlers)

    def fetch(self, endpoint, params=None):
        url = f"{self.base_url}/{endpoint}"
        if params:
            query = urllib.parse.urlencode(params)
            url += f"?{query}"
        
        req = urllib.request.Request(url)
        req.add_header("Authorization", self.auth_header)
        
        try:
            with self.opener.open(req, timeout=30) as response:
                if response.status == 200:
                    return json.loads(response.read().decode('utf-8'))
        except Exception as e:
            print(f"[ERROR] En {endpoint}: {e}")
        return None

    def run_full_extraction(self):
        print("[1/2] Extrayendo resumen de Audiencias...")
        audiences = self.fetch("lists")
        
        print("[2/2] Extrayendo Reportes de Campañas...")
        reports = self.fetch("reports", params={"count": 20, "sort_field": "send_time", "sort_dir": "DESC"})
        
        data_dump = {
            "last_updated": datetime.now().isoformat(),
            "audiences": audiences.get("lists", []) if audiences else [],
            "campaign_reports": reports.get("reports", []) if reports else []
        }

        os.makedirs(os.path.join("data", "marketing"), exist_ok=True)
        output_path = os.path.join("data", "marketing", "mailchimp_data.json")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data_dump, f, indent=4, ensure_ascii=False)
        print(f"[EXITO] Mailchimp guardado.")

if __name__ == "__main__":
    extractor = MailchimpExtractor()
    extractor.run_full_extraction()
