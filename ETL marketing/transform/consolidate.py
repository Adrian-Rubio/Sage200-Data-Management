import json
import os
from datetime import datetime

def consolidate_data():
    print("--- Consolidando Directorio de Leads (Fix: Multi-Tienda) ---")
    
    mailchimp_path = os.path.join("data", "mailchimp_data.json")
    prestashop_path = os.path.join("data", "prestashop_data.json")
    
    if not os.path.exists(mailchimp_path) or not os.path.exists(prestashop_path):
        return

    with open(mailchimp_path, "r", encoding="utf-8") as f:
        mc = json.load(f)
    with open(prestashop_path, "r", encoding="utf-8") as f:
        ps = json.load(f)

    total_subscribers = sum(a['stats']['member_count'] for a in mc['audiences'])
    leads_map = {}

    for store in ps['stores']:
        store_name = store['store_name']
        p_map = store.get('product_names', {})
        
        # 1. Clientes registrados (Sin sobrescribir si ya existen de otra tienda)
        for cust in store['customers']:
            email = cust['email'].lower().strip()
            if email not in leads_map:
                leads_map[email] = {
                    "email": email,
                    "store": store_name,
                    "score": 0,
                    "stats": {"pdfs_count": 0, "quotes_count": 0},
                    "history": {"pdfs": [], "quotes": []}
                }

        # 2. PDFs
        for p in store.get('pdfs', []):
            # Intentamos buscar el lead por el ID de cliente de esta tienda
            c_id = str(p.get('id_customer'))
            # Como los PDFs no traen email, buscamos en los clientes de esta tienda
            email_found = None
            for cust in store['customers']:
                if str(cust['id']) == c_id:
                    email_found = cust['email'].lower().strip()
                    break
            
            if email_found and email_found in leads_map:
                lead = leads_map[email_found]
                lead['stats']['pdfs_count'] += 1
                lead['score'] += 1
                p_id = str(p.get('id_product'))
                p['product_name'] = p_map.get(p_id, f"Producto #{p_id}")
                lead['history']['pdfs'].append(p)
        
        # 3. Presupuestos (Usamos el email directo de la solicitud)
        for q in store.get('quotes', []):
            email = q.get('email', '').lower().strip()
            if not email: continue
            
            if email not in leads_map:
                leads_map[email] = {
                    "email": email,
                    "store": store_name,
                    "score": 0,
                    "stats": {"pdfs_count": 0, "quotes_count": 0},
                    "history": {"pdfs": [], "quotes": []}
                }
            
            lead = leads_map[email]
            lead['stats']['quotes_count'] += 1
            lead['score'] += 5
            
            try:
                p_info = json.loads(q.get('products', '[]'))
                q['product_list_names'] = [p_map.get(str(item['id_product']), f"ID:{item['id_product']}") for item in p_info]
            except:
                q['product_list_names'] = ["Error en productos"]
            
            lead['history']['quotes'].append(q)

    # Ordenar y guardar
    final_leads = [l for l in leads_map.values() if l['score'] > 0]
    final_leads.sort(key=lambda x: x['score'], reverse=True)

    unified_data = {
        "last_updated": datetime.now().isoformat(),
        "marketing": {"total_subscribers": total_subscribers, "campaigns": mc['campaign_reports']},
        "sales": {
            "total_customers": sum(s['customers_count'] for s in ps['stores']),
            "total_pdfs": sum(s.get('pdfs_count', 0) for s in ps['stores']),
            "total_quotes": sum(s.get('quotes_count', 0) for s in ps['stores']),
            "leads": final_leads
        },
        "kpis": {"marketing_coverage": 0}
    }

    with open(os.path.join("data", "unified_data.json"), "w", encoding="utf-8") as f:
        json.dump(unified_data, f, indent=4, ensure_ascii=False)
    print(f"[OK] Consolidación corregida. Leads procesados: {len(final_leads)}")

if __name__ == "__main__":
    consolidate_data()
