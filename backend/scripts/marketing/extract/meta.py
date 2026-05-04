import os
import requests
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

def get_meta_leads():
    """Extrae leads de Meta Ads API"""
    token = os.getenv('META_ACCESS_TOKEN')
    account_id = os.getenv('META_AD_ACCOUNT_ID')
    
    if not token or not account_id:
        print("Meta: Faltan credenciales. Devolviendo datos de ejemplo.")
        return pd.DataFrame([
            {'lead_id': 'L1', 'email': 'test@example.com', 'campaign': 'Campaña Primavera', 'date': '2024-04-20'},
            {'lead_id': 'L2', 'email': 'user2@gmail.com', 'campaign': 'Campaña Primavera', 'date': '2024-04-21'}
        ])

    # Ejemplo de llamada real (comentada hasta tener credenciales)
    # url = f"https://graph.facebook.com/v19.0/{account_id}/leads"
    # r = requests.get(url, params={'access_token': token})
    # return pd.DataFrame(r.json()['data'])
    return pd.DataFrame()
