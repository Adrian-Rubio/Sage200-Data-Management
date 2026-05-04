import os
import sys
import webbrowser
import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from main import app as api_app

# Crear una nueva aplicación que envuelve a la API y sirve los archivos estáticos
app = FastAPI(title="Gulah Dashboard Portable")

# Determinar la ruta de los archivos estáticos (dist)
# Cuando se empaqueta con PyInstaller, los archivos están en _MEIPASS o junto al exe
if getattr(sys, 'frozen', False):
    # Estamos en modo ejecutable
    base_path = sys._MEIPASS
else:
    # Estamos en modo desarrollo
    base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))

dist_path = os.path.join(base_path, "dist")

# 1. Montar los endpoints de la API original en /api
app.mount("/api", api_app)

# 2. Servir los archivos estáticos del frontend (JS, CSS, Imágenes)
if os.path.exists(dist_path):
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="static")
else:
    print(f"ADVERTENCIA: No se encontró la carpeta de frontend en {dist_path}")

# 3. Fallback para SPA (Single Page Application)
# Cualquier ruta que no coincida con archivos estáticos o /api devuelve el index.html
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    index_file = os.path.join(dist_path, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"error": "Frontend not found"}

def open_browser():
    # Esperar un segundo a que el servidor arranque
    import time
    time.sleep(1.5)
    webbrowser.open("http://localhost:8000")

if __name__ == "__main__":
    print("Iniciando Gulah Dashboard Portable...")
    print("Conectando con SQL Server y sincronizando caché local...")
    
    # Abrir el navegador en un hilo separado
    import threading
    threading.Thread(target=open_browser, daemon=True).start()
    
    # Arrancar el servidor
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
