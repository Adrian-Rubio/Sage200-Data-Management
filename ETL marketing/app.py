from flask import Flask, send_from_directory, jsonify
import subprocess
import sys
import os

app = Flask(__name__, static_folder='web')

# Ruta para servir el Dashboard
@app.route('/')
def index():
    return send_from_directory('web', 'index.html')

# Ruta para servir los datos JSON
@app.route('/data/<path:filename>')
def serve_data(filename):
    return send_from_directory('data', filename)

# El "Mágico" botón de sincronización
@app.route('/sync', methods=['POST'])
def sync():
    try:
        print("\n[WEB] Iniciando sincronización forzada...")
        # Ejecutamos el script maestro
        result = subprocess.run([sys.executable, 'ejecutar_todo.py'], capture_output=True, text=True)
        if result.returncode == 0:
            return jsonify({"status": "success", "message": "Datos actualizados correctamente"})
        else:
            return jsonify({"status": "error", "message": result.stderr}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    print("==================================================")
    print(" SERVIDOR DE MARKETING ACTIVO")
    print(" URL: http://localhost:5000")
    print("==================================================")
    app.run(port=5000, debug=True)
