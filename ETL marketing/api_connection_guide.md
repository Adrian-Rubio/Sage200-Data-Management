# Guía de Conexión a APIs de Marketing

Esta guía explica paso a paso dónde y cómo obtener las credenciales necesarias para conectar Meta Ads, Mailchimp y PrestaShop a tu sistema ETL.

---

## 1. Meta Ads (Facebook Ads)

Para extraer datos de campañas y leads, necesitas crear una aplicación en el portal de desarrolladores de Meta.

1.  **Entra en:** [Meta for Developers](https://developers.facebook.com/) e inicia sesión.
2.  **Crea una App:** Haz clic en "Mis aplicaciones" -> "Crear aplicación". Elige el tipo "Empresa".
3.  **Añade el producto "Marketing API":** En el panel de control de tu app, busca Marketing API y haz clic en "Configurar".
4.  **Genera un Access Token:**
    - Ve a **Marketing API** -> **Herramientas**.
    - En el "Explorador de la Graph API", selecciona los permisos: `ads_read`, `read_insights`, `ads_management` y `leads_retrieval`.
    - Haz clic en "Generar identificador de acceso".
5.  **Obtén el ID de la Cuenta:** Lo encontrarás en tu Ads Manager (Administrador de anuncios). Suele tener el formato `act_XXXXXXXXXXXX`.

> [!TIP]
> Los tokens generados aquí suelen ser de "Corta duración" (caducan en horas). Para producción, deberás intercambiarlo por un "Token de larga duración" en la configuración de la App.

---

## 2. Mailchimp

1.  **Inicia sesión en Mailchimp.**
2.  **API Key:**
    - Haz clic en tu perfil (esquina inferior izquierda) -> **Account & billing**.
    - Ve a **Extras** -> **API keys**.
    - Haz clic en **Create A Key**, ponle un nombre (ej. "ETL Marketing") y copia la clave.
3.  **Server Prefix:** Es la primera parte de la URL de tu panel de Mailchimp (ej. si tu URL es `https://us19.admin.mailchimp.com/`, tu prefijo es `us19`).
4.  **Audience ID (List ID):**
    - Ve a **Audience** -> **All contacts**.
    - Haz clic en **Settings** -> **Audience name and defaults**.
    - Verás el "Audience ID" en el panel de la derecha.

---

## 3. PrestaShop (Webservice)

1.  **Entra en el Panel de Administración de tu PrestaShop.**
2.  **Activa el Webservice:**
    - Ve a **Parámetros Avanzados** -> **Webservice**.
    - Asegúrate de que "Activar el Webservice de PrestaShop" esté en **SÍ**.
3.  **Crea la clave (wskey):**
    - Haz clic en "Añadir una nueva clave de webservice".
    - Haz clic en "Generar" para obtener la clave.
    - **Permisos:** En la tabla de recursos, marca al menos `GET` para:
        - `customers`
        - `orders`
        - `order_details`
        - `products`
        - `addresses`
    - Guarda la configuración.
4.  **URL de la API:** Suele ser `https://tutienda.com/api/`.

---

## 4. Configuración del archivo `.env`

Crea un archivo llamado `.env` en la carpeta `config/` de tu proyecto y pega lo siguiente, rellenando con tus datos:

```ini
# Meta Ads
META_ACCESS_TOKEN="tu_token_aqui"
META_AD_ACCOUNT_ID="act_XXXXXXXXXXXX"

# Mailchimp
MAILCHIMP_API_KEY="tu_api_key_aqui"
MAILCHIMP_SERVER_PREFIX="usXX"
MAILCHIMP_AUDIENCE_ID="XXXXXXXX"

# PrestaShop
PRESTASHOP_URL="https://tu-tienda.com/api"
PRESTASHOP_WS_KEY="tu_clave_de_webservice"
```
