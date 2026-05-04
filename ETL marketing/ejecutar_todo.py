import subprocess
import sys
import os

def run_script(script_path):
    print(f"\n[EJECUTANDO] {script_path}...")
    result = subprocess.run([sys.executable, script_path], capture_output=True, text=True)
    if result.returncode == 0:
        print(f"[OK] {script_path} completado.")
        # print(result.stdout)
    else:
        print(f"[ERROR] Fallo en {script_path}")
        print(result.stderr)

if __name__ == "__main__":
    print("=== INICIANDO PIPELINE DE DATOS COMPLETO ===")
    
    # 1. Extraer Mailchimp
    run_script("extract/mailchimp.py")
    
    # 2. Extraer PrestaShop (con los nuevos campos)
    run_script("extract/prestashop.py")
    
    # 3. Consolidar y Unificar
    run_script("transform/consolidate.py")
    
    print("\n=== PIPELINE FINALIZADO ===")
    print("Ya puedes refrescar el dashboard en tu navegador.")
