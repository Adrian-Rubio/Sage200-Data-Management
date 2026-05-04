# Plan de Acción: ETL de Marketing (Enfoque File-Based / Parquet)

Este plan detalla cómo extraer datos de Meta, Mailchimp y PrestaShop y almacenarlos localmente en archivos **Parquet**. Este enfoque elimina la necesidad de mantener un servidor SQL, aprovechando la potencia de Pandas para el análisis y la visualización.

## 1. Arquitectura del Proyecto

```text
marketing_etl/
├── data/
│   ├── staging/               # Datos "crudos" tal cual vienen de la API
│   └── core/                  # Datos limpios y unificados listos para la App
├── config/
│   └── .env                   # Credenciales y secretos
├── extract/
│   ├── meta.py                # Extractor de Meta Ads
│   ├── mailchimp.py           # Extractor de Mailchimp
│   └── prestashop.py          # Extractor de PrestaShop
├── transform/
│   └── process_data.py        # Limpieza y cruce de datos (Pandas)
└── run_etl.py                 # Orquestador (ejecuta todo el flujo)
```

## 2. Instalación de Dependencias

Ejecuta el siguiente comando en tu terminal para preparar el entorno:

```bash
pip install requests pandas pyarrow fastparquet python-dotenv
```

*Nota: `pyarrow` o `fastparquet` son necesarios para que Pandas pueda manejar archivos Parquet.*

## 3. Flujo de Trabajo (Pipeline)

1.  **Extracción:** Cada script en `extract/` hace una petición a la API correspondiente y devuelve un DataFrame de Pandas.
2.  **Persistencia Inicial (Staging):** Los datos se guardan en `data/staging/nombre_fuente.parquet`. Esto sirve como copia de seguridad histórica.
3.  **Transformación:** El script `transform/process_data.py` lee los archivos de staging, normaliza los emails, une los leads con las ventas y guarda el resultado final en `data/core/dashboard_data.parquet`.
4.  **Consumo:** Tu aplicación web simplemente hace un `pd.read_parquet('data/core/dashboard_data.parquet')` para obtener los datos listos para graficar.

## 4. Estructura de Datos Sugerida

### Archivo: `meta_leads.parquet`
- `lead_id`, `email`, `campaign_name`, `created_time`, `form_id`.

### Archivo: `prestashop_orders.parquet`
- `order_id`, `customer_email`, `total_paid`, `date_add`, `status`.

### Archivo: `unified_marketing.parquet` (El que lee la web)
- `date`, `leads_count`, `orders_count`, `revenue`, `source`.

---

## Próximos Pasos
1.  Configurar las APIs siguiendo la **Guía de Conexión**.
2.  Rellenar el archivo `.env` con los tokens obtenidos.
3.  Ejecutar la primera extracción de prueba.
