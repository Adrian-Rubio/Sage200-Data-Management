# Sage200 Dashboard & Data Management

Sistema integral de gestión de datos y visualización de KPIs para Sage 200, que combina un backend en FastAPI, un frontend en React y reportes de PowerBI distribuidos.

## 📂 Estructura del Proyecto

-   **`backend/`**: Servidor API desarrollado con **FastAPI** (Python). Se conecta a SQL Server para extraer datos de ventas, compras, producción y almacén.
-   **`frontend/`**: Aplicación web desarrollada con **React (Vite)**. Proporciona una interfaz moderna con dashboards interactivos, filtros avanzados y gráficos de evolución.
-   **`pbix_almacen_extracted/`**: Versión extraída del reporte de PowerBI para facilitar el seguimiento de cambios.
-   **`*.pbix`**: Archivos de PowerBI (Dashboard de Almacén y Pedidos Pendientes) gestionados mediante **Git LFS**.

## ⚙️ Requisitos Previos

-   **Python 3.9+**
-   **Node.js & npm**
-   **ODBC Driver 17 for SQL Server** (para la conexión del backend)
-   **Git LFS** (instalado y activo para descargar archivos grandes)

## 🚀 Instalación y Puesta en Marcha

### Inicio Rápido (Windows)
Puedes arrancar ambos servicios simultáneamente usando el archivo por lotes:
```bash
./start_dashboard.bat
```

### Configuración Manual

#### 1. Backend (FastAPI)
1.  Entra en `backend/`.
2.  Crea un entorno virtual: `python -m venv venv`.
3.  Activa el entorno: `venv\Scripts\activate`.
4.  Instala dependencias: `pip install -r requirements.txt`.
5.  Configura el archivo `.env` con las credenciales de SQL Server (usa `.env.example` como base).
6.  Inicia el servidor: `uvicorn main:app --reload`.

#### 2. Frontend (React + Vite)
1.  Entra en `frontend/`.
2.  Instala las dependencias: `npm install`.
3.  Inicia el servidor de desarrollo: `npm run dev`.

## 📦 Manejo de Archivos Grandes (Git LFS)

Este repositorio utiliza **Git Large File Storage (LFS)** para los archivos `.pbix` y modelos de datos pesados que superan los 100MB.

-   **Si acabas de clonar el repo**, asegúrate de descargar los archivos reales con:
    ```bash
    git lfs install
    git lfs pull
    ```
-   **Para añadir nuevos reportes grandes**: Los archivos `.pbix` se rastrearán automáticamente. No olvides hacer commit del archivo `.gitattributes` si realizas cambios de configuración.

## ✨ Características Principales

-   **Dashboards de Ventas**: Margen comercial, KPIs de facturación, ventas por representante y evolución diaria.
-   **Módulo de Producción**: Seguimiento de operarios, incidencias y estados de órdenes.
-   **Módulo de Almacén**: Gestión de pedidos de almacén y estados de stock.
-   **Filtros Globales**: Filtrado por fecha, empresa, vendedor, división y cliente.
-   **Acceso Centralizado**: El dashboard principal se sirve habitualmente en `http://metricas.cenval.es`.

