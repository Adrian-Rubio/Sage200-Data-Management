import os
import sys
sys.path.append(os.getcwd())

from database import engine
from sqlalchemy import text
import pandas as pd

def test_pnl_query():
    query = """
    SELECT 
        CodigoEmpresa, Ejercicio,
        CASE 
            WHEN CodigoCuenta LIKE '700%' THEN '1. Importe neto cifra de negocios'
            WHEN CodigoCuenta LIKE '710%' THEN '2. Variación existencias prod. term. y en curso'
            WHEN CodigoCuenta LIKE '730%' THEN '3. Trabajos realizados por la emp. para su activo'
            WHEN CodigoCuenta LIKE '600%' OR CodigoCuenta LIKE '610%' OR CodigoCuenta LIKE '620%' THEN '4. Aprovisionamientos'
            WHEN CodigoCuenta LIKE '740%' THEN '5. Otros ingresos de explotación'
            WHEN CodigoCuenta LIKE '640%' THEN '6. Gastos de personal'
            WHEN CodigoCuenta LIKE '621%' OR CodigoCuenta LIKE '622%' OR CodigoCuenta LIKE '623%' 
              OR CodigoCuenta LIKE '624%' OR CodigoCuenta LIKE '625%' OR CodigoCuenta LIKE '626%' 
              OR CodigoCuenta LIKE '627%' OR CodigoCuenta LIKE '628%' OR CodigoCuenta LIKE '629%' 
            THEN '7. Otros gastos de explotación'
            WHEN CodigoCuenta LIKE '680%' OR CodigoCuenta LIKE '681%' OR CodigoCuenta LIKE '682%' THEN '8. Amortización del inmovilizado'
            WHEN CodigoCuenta LIKE '690%' OR CodigoCuenta LIKE '691%' THEN '10. Excesos de provisiones'
            WHEN CodigoCuenta LIKE '670%' THEN '13. Otros resultados'
            WHEN CodigoCuenta LIKE '760%' THEN '14. Ingresos financieros'
            WHEN CodigoCuenta LIKE '662%' OR CodigoCuenta LIKE '663%' THEN '15. Gastos financieros'
            WHEN CodigoCuenta LIKE '763%' THEN '16. Variación valor razonable instrum. financ.'
            WHEN CodigoCuenta LIKE '768%' THEN '17. Diferencias de cambio'
            WHEN CodigoCuenta LIKE '669%' THEN '18. Deterioro y resultados de instrumentos fin.'
            ELSE 'Otros'
        END AS Apartado_PyG,
        SUM(HaberAcum - DebeAcum) AS Total  -- Changed to Haber - Debe since revenues are Credit (Haber) and expenses are Debit (Debe). This way revenues are positive, expenses are negative or vice versa. Usually in PnL, revenues are positive, expenses negative. Ex: 700 is Haber. So Haber - Debe = positive revenue. 600 is Debe. So Haber - Debe = negative expense.
    FROM AcumuladosConta
    WHERE CodigoEmpresa IN (100, 2, 4, 6)
      AND Ejercicio = 2025
    GROUP BY 
        CodigoEmpresa, Ejercicio,
        CASE 
            WHEN CodigoCuenta LIKE '700%' THEN '1. Importe neto cifra de negocios'
            WHEN CodigoCuenta LIKE '710%' THEN '2. Variación existencias prod. term. y en curso'
            WHEN CodigoCuenta LIKE '730%' THEN '3. Trabajos realizados por la emp. para su activo'
            WHEN CodigoCuenta LIKE '600%' OR CodigoCuenta LIKE '610%' OR CodigoCuenta LIKE '620%' THEN '4. Aprovisionamientos'
            WHEN CodigoCuenta LIKE '740%' THEN '5. Otros ingresos de explotación'
            WHEN CodigoCuenta LIKE '640%' THEN '6. Gastos de personal'
            WHEN CodigoCuenta LIKE '621%' OR CodigoCuenta LIKE '622%' OR CodigoCuenta LIKE '623%' 
              OR CodigoCuenta LIKE '624%' OR CodigoCuenta LIKE '625%' OR CodigoCuenta LIKE '626%' 
              OR CodigoCuenta LIKE '627%' OR CodigoCuenta LIKE '628%' OR CodigoCuenta LIKE '629%' 
            THEN '7. Otros gastos de explotación'
            WHEN CodigoCuenta LIKE '680%' OR CodigoCuenta LIKE '681%' OR CodigoCuenta LIKE '682%' THEN '8. Amortización del inmovilizado'
            WHEN CodigoCuenta LIKE '690%' OR CodigoCuenta LIKE '691%' THEN '10. Excesos de provisiones'
            WHEN CodigoCuenta LIKE '670%' THEN '13. Otros resultados'
            WHEN CodigoCuenta LIKE '760%' THEN '14. Ingresos financieros'
            WHEN CodigoCuenta LIKE '662%' OR CodigoCuenta LIKE '663%' THEN '15. Gastos financieros'
            WHEN CodigoCuenta LIKE '763%' THEN '16. Variación valor razonable instrum. financ.'
            WHEN CodigoCuenta LIKE '768%' THEN '17. Diferencias de cambio'
            WHEN CodigoCuenta LIKE '669%' THEN '18. Deterioro y resultados de instrumentos fin.'
            ELSE 'Otros'
        END
    HAVING SUM(HaberAcum - DebeAcum) != 0
    ORDER BY CodigoEmpresa, Apartado_PyG;
    """
    with engine.connect() as conn:
        try:
            df = pd.read_sql(text(query), conn)
            # Let's print pivot table
            pivot_df = df.pivot_table(index='Apartado_PyG', columns='CodigoEmpresa', values='Total', aggfunc='sum').fillna(0)
            print("--- P&L BY COMPANY (2025) ---")
            print(pivot_df)
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    test_pnl_query()
