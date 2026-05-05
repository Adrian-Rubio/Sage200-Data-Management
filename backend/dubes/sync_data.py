import datetime
import time
import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, joinedload, sessionmaker
from urllib.parse import quote_plus
from . import database
from .database_cache import SessionLocal as CacheSession, engine as cache_engine
from . import models

# Configuración de Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Asegurar que las tablas existen en la caché local
models.Base.metadata.create_all(bind=cache_engine)

def sync_tables():
    logger.info("Iniciando ciclo de sincronización multi-local...")
    
    # Parche para permitir protocolos SSL antiguos (TLS 1.0/1.1) en servidores Linux modernos
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    openssl_conf = os.path.join(base_dir, "openssl_permissive.cnf")
    if os.path.exists(openssl_conf):
        os.environ["OPENSSL_CONF"] = openssl_conf
        logger.info(f"Cargada configuración de OpenSSL permisiva: {openssl_conf}")
    
    # Lista de IPs conocidas para Jardín, Gulah y otros
    possible_ips = ["10.0.8.2", "10.0.8.3", "10.0.8.5", "127.0.0.1"]
    
    for ip in possible_ips:
        # Intentar con y sin instancia
        servers = [f"{ip}\\Misstipsi", ip]
        connected = False
        
        for server in servers:
            if connected: break
            temp_engine = None
            try:
                temp_params = quote_plus(
                    f"DRIVER={{{database.DB_DRIVER}}};SERVER={server};DATABASE={database.DB_DATABASE};UID={database.DB_USER};PWD={database.DB_PASSWORD};Connect Timeout=2;TrustServerCertificate=yes;Encrypt=no;"
                )
                temp_url = f"mssql+pyodbc:///?odbc_connect={temp_params}"
                temp_engine = create_engine(temp_url)
                
                # Verificar conexión
                with temp_engine.connect() as conn:
                    conn.execute(text("SELECT 1"))
                
                logger.info(f"--- Conectado con éxito a: {server} ---")
                connected = True
                
                source_db = sessionmaker(bind=temp_engine)()
                cache_db = CacheSession()
                
                try:
                    # Obtener nombre del local para el log
                    local_obj = source_db.query(models.Local).first()
                    local_name = local_obj.Name if local_obj else "Desconocido"
                    logger.info(f"Local detectado: {local_name}")

                    # 1. Sincronizar Staff (Empleados)
                    staff = source_db.query(models.Employee).all()
                    for emp in staff:
                        cache_db.merge(emp)
                    cache_db.commit()

                    # 1b. Sincronizar Locales y Mapas
                    locals_list = source_db.query(models.Local).all()
                    for loc in locals_list:
                        cache_db.merge(loc)
                    
                    maps_list = source_db.query(models.Map).all()
                    for m in maps_list:
                        cache_db.merge(m)
                    
                    cache_db.commit()

                    # 2. Sincronizar Elementos (Mesas/Barra)
                    elements = source_db.query(models.Element).all()
                    for el in elements:
                        cache_db.merge(el)
                    cache_db.commit()

                    # 3. Sincronizar Ventas (Sales) - INCREMENTAL por local
                    local_ids = [l.Id for l in locals_list]
                    last_sale = cache_db.query(models.Sale).join(models.Element).join(models.Map).filter(
                        models.Map.LocalId.in_(local_ids)
                    ).order_by(models.Sale.CheckOutDate.desc()).first()
                    
                    last_date = last_sale.CheckOutDate if last_sale else (datetime.datetime.now() - datetime.timedelta(days=730))
                    
                    new_sales_query = source_db.query(models.Sale).options(joinedload(models.Sale.lines)).filter(
                        models.Sale.CheckOutDate > last_date,
                        models.Sale.IsDeleted == False
                    ).order_by(models.Sale.CheckOutDate.asc())

                    all_new_sales = new_sales_query.all()
                    
                    if all_new_sales:
                        logger.info(f"Detectadas {len(all_new_sales)} nuevas ventas en {local_name}. Procesando...")
                        total_new = 0
                        for sale in all_new_sales:
                            sale_copy = models.Sale(
                                Id=sale.Id, ElementId=sale.ElementId, WaiterId=sale.WaiterId,
                                CheckInDate=sale.CheckInDate, CheckOutDate=sale.CheckOutDate, 
                                GuestNumber=sale.GuestNumber, Total=sale.Total, 
                                SubTotal=sale.SubTotal, IsDeleted=sale.IsDeleted,
                                OrderNumber=sale.OrderNumber
                            )
                            cache_db.merge(sale_copy)
                            for line in sale.lines:
                                line_copy = models.SaleDetail(
                                    Id=line.Id, TicketId=line.TicketId, SaleId=line.SaleId,
                                    ArticleId=line.ArticleId, Description=line.Description,
                                    Amount=line.Amount, UnitPrice=line.UnitPrice, Total=line.Total,
                                    Invitation=line.Invitation,
                                    Observation=line.Observation
                                )
                                cache_db.merge(line_copy)
                            
                            total_new += 1
                            if total_new % 200 == 0:
                                cache_db.commit()
                                logger.info(f"Sincronizados {total_new} tickets...")
                        
                        cache_db.commit()
                    # 4. Sincronizar Cierres de Caja (ClosingCashes) - INCREMENTAL
                    last_closure = cache_db.query(models.ClosingCash).filter(
                        models.ClosingCash.LocalId.in_(local_ids)
                    ).order_by(models.ClosingCash.CloseDate.desc()).first()

                    last_closure_date = last_closure.CloseDate if last_closure else (datetime.datetime.now() - datetime.timedelta(days=730))

                    new_closures = source_db.query(models.ClosingCash).filter(
                        models.ClosingCash.CloseDate > last_closure_date,
                        models.ClosingCash.IsDeleted == False
                    ).order_by(models.ClosingCash.CloseDate.asc()).all()

                    if new_closures:
                        logger.info(f"Detectados {len(new_closures)} nuevos cierres en {local_name}.")
                        for closure in new_closures:
                            cache_db.merge(closure)
                        cache_db.commit()

                except Exception as e:
                    logger.error(f"Error sincronizando {ip}: {e}")
                    cache_db.rollback()
                finally:
                    source_db.close()
                    cache_db.close()
                    
            except Exception as e:
                if server == servers[-1] and not connected:
                    logger.error(f"Fallo crítico al intentar conectar con {ip}: {e}")
                continue
    
    logger.info("Ciclo de sincronización completado.")

if __name__ == "__main__":
    sync_tables()
