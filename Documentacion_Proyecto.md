# Documentación Exhaustiva: Sage200 Dashboard & Data Management

## 1. Visión General del Proyecto
Este proyecto es un **sistema web integral de gestión de datos y visualización de KPIs** diseñado para integrarse con el ERP **Sage 200**. 
Su propósito principal es actuar como un panel de control (Dashboard) global de la empresa, extrayendo información de ventas, compras, producción, almacén y finanzas, y presentándola en una interfaz moderna y rápida usando gráficos y tablas dinámicas.

El proyecto está dividido en dos grandes bloques (Arquitectura Cliente-Servidor):
- **Backend**: API REST en Python.
- **Frontend**: Single Page Application (SPA) en React.

---

## 2. Pila Tecnológica (Tech Stack)

### 2.1 Backend (Servidor API)
El backend está alojado en el directorio `/backend` y se encarga de conectar con la base de datos, procesar la lógica de negocio y exponer endpoints de la API.
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (versión 0.129). Se utiliza por su alto rendimiento, soporte asíncrono y auto-generación de documentación (Swagger).
- **Lenguaje**: Python 3.9+.
- **Base de Datos**: Microsoft SQL Server. La conexión se realiza a través de `pyodbc` (versión 5.3) y el driver **ODBC Driver 17 for SQL Server**. La aplicación establece una conexión de solo lectura (`ApplicationIntent=ReadOnly`) por seguridad.
- **ORM**: [SQLAlchemy](https://www.sqlalchemy.org/) (versión 2.0). Se utiliza para mapear tablas, ejecutar queries SQL en crudo y manejar la sesión de la base de datos.
- **Autenticación**: JSON Web Tokens (JWT) mediante `PyJWT`, contraseñas hasheadas usando `bcrypt` a través de `passlib`.
- **Análisis de Datos**: Para algunas operaciones complejas y exportaciones, el backend hace uso de `pandas` y `numpy`.
- **Servidor ASGI**: `uvicorn`.

### 2.2 Frontend (Interfaz de Usuario)
La aplicación frontend está alojada en el directorio `/frontend`. Es la parte visual interactiva que consume la API del backend.
- **Librería Core**: [React](https://react.dev/) (versión 19).
- **Herramienta de Build**: [Vite](https://vitejs.dev/). Se prefiere sobre Create React App por su extrema rapidez en desarrollo y compilación.
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/) (versión 4). Usado para estilizado rápido mediante clases de utilidad sin necesidad de escribir CSS a mano.
- **Enrutamiento**: `react-router-dom` (v7). Para la navegación por las distintas secciones (Ventas, Compras, etc.) sin recargar la página.
- **Gestión de Estado**: [Zustand](https://github.com/pmndrs/zustand) (v5). Utilizado para manejar el estado global de la aplicación (como el tema claro/oscuro o preferencias globales) de forma más ligera que Redux.
- **Peticiones HTTP**: `axios`. Se usa un cliente configurado (`api.js`) para inyectar automáticamente el token JWT en todas las peticiones y gestionar errores 401 (caducidad de sesión).
- **Visualización de Datos**: [Recharts](https://recharts.org/) (v3) para las gráficas interactivas y `react-simple-maps` para posibles representaciones geográficas.
- **Componentes UI avanzados**: Integra primitivas de Radix UI (`@radix-ui/react-select`, `@radix-ui/react-slot`) junto a `lucide-react` para la iconografía y `clsx`/`tailwind-merge` para el manejo dinámico de clases.
- **Exportación/Descarga**: Usa `exceljs` y `file-saver` para exportaciones a Excel y `docx` para creación de documentos.

### 2.3 Otros Componentes
- **Git LFS**: Git Large File Storage se utiliza para manejar los archivos de reporte de PowerBI (`.pbix`) y archivos de datos pesados (CSVs, Exceles) para no saturar el propio repositorio Git.

---

## 3. Arquitectura y Módulos Principales

### 3.1 Backend: Organización de Módulos (Routers)
El archivo principal es `main.py`, donde se inicializa la app FastAPI y se registran los routers (controladores). Los módulos corresponden a diferentes áreas de la empresa:
- `/sales` y `/filters`: Datos de facturación, comparación de ventas, cuadros de mando y opciones de filtrado.
- `/orders` e `/inventory`: Gestión de pedidos (pendientes, de envío) y estados del inventario.
- `/finance` y `/budgets`: Módulos de tesorería, cuenta de explotación (PyG/P&L) y gestión de presupuestos.
- `/production` y `/rma`: Operaciones de producción y devoluciones/RMA.
- `/almacen` y `/purchases` (incluido `/aprovisionamiento`): Existencias en almacenes, pedidos de compra y previsión de abastecimiento.
- `/auth/users`: Sistema de login, cruds de usuarios y de roles.

### 3.2 Frontend: Estructura de Vistas (Pages)
El enrutador (`App.jsx`) define cómo se accede a los distintos módulos, todos protegidos por `<PrivateRoute />` excepto el login:
- `/ventas`: Dashboard de ventas.
- `/compras`, `/compras/pedidos-pendientes`, `/compras/prevision-aprovisionamiento`.
- `/produccion`, `/produccion/rma`.
- `/finanzas/tesoreria`, `/finanzas/explotacion`.
- `/almacen`, `/inventario`, `/contabilidad`, `/cierre-mes`.

Las llamadas a la API están centralizadas en `/frontend/src/services/api.js`, lo que facilita el mantenimiento. El servidor local Vite está configurado (`vite.config.js`) para redirigir transparente las peticiones `/api` al puerto `8000` (el backend).

---

## 4. Guía de Replicación del Entorno (Setup Guide)

Para levantar este proyecto desde cero en un nuevo ordenador, sigue estos pasos:

### Paso 1: Requisitos Previos (System Requirements)
1. Instalar **Python 3.9 o superior** (asegúrate de marcar "Add to PATH" en la instalación).
2. Instalar **Node.js** (incluye NPM). Recomendada la versión LTS más reciente.
3. Instalar **ODBC Driver 17 for SQL Server** (requisito de Microsoft para conectarse a la BBDD desde Python).
4. Instalar **Git** y **Git LFS** (para poder descargar los `.pbix`).

### Paso 2: Clonado del Repositorio
```bash
git clone <url-del-repositorio>
cd Data_Management
git lfs install
git lfs pull
```
*Si no haces el `lfs pull`, los archivos pesados serán simples punteros de texto y el proyecto podría no funcionar correctamente.*

### Paso 3: Configurar el Backend (Python)
Abre un terminal y navega hasta la carpeta del backend:
```bash
cd backend
python -m venv venv
```
Activar el entorno virtual (En Windows):
```bash
venv\Scripts\activate
```
Instalar las dependencias de Python:
```bash
pip install -r requirements.txt
```
**Credenciales de Base de datos:**
Debes crear un archivo llamado `.env` dentro de la carpeta `/backend`. Usa un posible `.env.example` como plantilla o créalo y define lo siguiente:
```ini
DB_SERVER=ip_del_servidor_sage
DB_DATABASE=nombre_de_bd
DB_USER=usuario_lectura_sage
DB_PASSWORD=contraseña
```

### Paso 4: Configurar el Frontend (React/Node)
Abre un **segundo terminal paralelo** y navega a la carpeta del frontend:
```bash
cd frontend
npm install
```
*Esto descargará todas las librerías necesarias dentro de `node_modules`.*

### Paso 5: Ejecutar la Aplicación Localmente
Tienes dos opciones para levantar los servidores en desarrollo:

**Opción A: Script Automático (Solo Windows)**
En la raíz del proyecto, simplemente haz doble click o ejecuta en terminal:
```cmd
start_dashboard.bat
```
Esto levantará dos ventanas con ambos servicios.

**Opción B: Manual**
1. En el terminal del backend (con el `venv` activado), ejecuta:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
2. En el terminal del frontend, ejecuta:
   ```bash
   npm run dev
   ```

Una vez en marcha, la interfaz web estará disponible en `http://localhost:5173/` (o lo que indique Vite por defecto) y la auto-documentación de la API en `http://localhost:8000/docs`. Se puede acceder vía `http://localhost/` si se accede por el puerto 80 ya que el local Vite lo levanta ahí en producción (`host: true, port: 80` en `vite.config.js`).

### Paso 6: Despliegue en Producción (Notas)
Para un entorno productivo real:
- El frontend debe ser compilado con `npm run build`, y los archivos generados en `/dist` deben ser servidos por un Nginx o IIS.
- El backend en lugar de arrancar con el `--reload`, debería usar una herramienta de gestión de procesos (como PM2, supervisor, o systemd) para mantener a Uvicorn/Gunicorn en ejecución.
