import os
import sys
import pandas as pd
from sqlalchemy import create_engine, text

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import SQLALCHEMY_DATABASE_URL

def check_sales_divs():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    query = """
        SELECT 
            CASE 
                WHEN UPPER(Comisionista) IN ('JOSE CESPEDES BLANCO', 'ANTONIO MACHO MACHO', 'JESUS COLLADO ARAQUE', 'ADRIÁN ROMERO JIMENEZ') THEN 'Conectrónica'
                WHEN UPPER(Comisionista) IN ('JUAN CARLOS BENITO RAMOS', 'JAVIER ALLEN PERKINS') THEN 'Sismecánica'
                WHEN UPPER(Comisionista) IN ('JUAN CARLOS VALDES ANTON') THEN 'Informática Industrial'
                ELSE 'Otros'
            END as Division,
            SUM(CAST(BaseImponible AS FLOAT)) as Venta
        FROM Vis_AEL_DiarioFactxComercial
        WHERE CodigoEmpresa = '2' AND EjercicioFactura = 2026 AND MONTH(FechaFactura) = 3
        GROUP BY 
            CASE 
                WHEN UPPER(Comisionista) IN ('JOSE CESPEDES BLANCO', 'ANTONIO MACHO MACHO', 'JESUS COLLADO ARAQUE', 'ADRIÁN ROMERO JIMENEZ') THEN 'Conectrónica'
                WHEN UPPER(Comisionista) IN ('JUAN CARLOS BENITO RAMOS', 'JAVIER ALLEN PERKINS') THEN 'Sismecánica'
                WHEN UPPER(Comisionista) IN ('JUAN CARLOS VALDES ANTON') THEN 'Informática Industrial'
                ELSE 'Otros'
            END
    """
    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn)
        print(df)
        print(f"TOTAL VENTAS MARZO: {df['Venta'].sum():,.2f} €")

if __name__ == "__main__":
    check_sales_divs()
