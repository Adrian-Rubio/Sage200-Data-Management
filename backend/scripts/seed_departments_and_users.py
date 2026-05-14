import sys
import os

# Add the parent directory to sys.path to import models and database
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
import auth
from datetime import datetime

def seed():
    db = SessionLocal()
    try:
        # 1. Create Departments
        departments_data = [
            "Ventas", "Producción", "Compras", "Marketing", "IT", "RRHH", "Contabilidad", "Dirección", "Logística"
        ]
        dept_map = {}
        for dept_name in departments_data:
            dept = db.query(models.Department).filter(models.Department.name == dept_name).first()
            if not dept:
                dept = models.Department(name=dept_name)
                db.add(dept)
                db.flush()
            dept_map[dept_name] = dept

        # 2. Create Divisions for Ventas
        divisions_data = ["Conectrónica", "Sismecánica", "Informática Industrial"]
        div_map = {}
        ventas_dept = dept_map["Ventas"]
        for div_name in divisions_data:
            div = db.query(models.Division).filter(models.Division.name == div_name, models.Division.department_id == ventas_dept.id).first()
            if not div:
                div = models.Division(name=div_name, department_id=ventas_dept.id)
                db.add(div)
                db.flush()
            div_map[div_name] = div

        # 3. Create Job Positions and Permissions
        # Ventas
        positions = [
            # Ventas
            {"name": "Responsable de División", "dept": "Ventas", "is_r": True, "is_a": False, "perms": {"ventas": True, "compras": True, "produccion": True, "inventario": True}},
            {"name": "Comercial", "dept": "Ventas", "is_r": False, "is_a": False, "perms": {"ventas": True, "compras": True, "produccion": True, "inventario": True}},
            {"name": "Asistente Comercial", "dept": "Ventas", "is_r": False, "is_a": True, "perms": {"ventas": False, "compras": True, "produccion": True, "inventario": True}},
            # Producción
            {"name": "Responsable de Producción", "dept": "Producción", "is_r": True, "is_a": False, "perms": {"produccion": True, "calidad": True}},
            {"name": "Operario de Producción", "dept": "Producción", "is_r": False, "is_a": False, "perms": {"produccion": True, "calidad": True}},
            # Compras
            {"name": "Responsable de Compras", "dept": "Compras", "is_r": True, "is_a": False, "perms": {"compras": True, "produccion": True, "inventario": True}},
            {"name": "Técnico de Compras", "dept": "Compras", "is_r": False, "is_a": False, "perms": {"compras": True, "produccion": True, "inventario": True}},
            # IT
            {"name": "Responsable de IT", "dept": "IT", "is_r": True, "is_a": False, "perms": {"ventas": True, "compras": True, "produccion": True, "finanzas": True, "almacen": True, "inventario": True, "rrhh": True, "calidad": True, "admin": False}},
            {"name": "Técnico IT", "dept": "IT", "is_r": False, "is_a": False, "perms": {"ventas": True, "compras": True, "produccion": True, "finanzas": True, "almacen": True, "inventario": True, "rrhh": True, "calidad": True, "admin": False}},
            # Contabilidad
            {"name": "Responsable de Contabilidad", "dept": "Contabilidad", "is_r": True, "is_a": False, "perms": {"ventas": True, "compras": True, "finanzas": True}},
            {"name": "Contable", "dept": "Contabilidad", "is_r": False, "is_a": False, "perms": {"ventas": True, "compras": True, "finanzas": True}},
            # Marketing
            {"name": "Responsable de Marketing", "dept": "Marketing", "is_r": True, "is_a": False, "perms": {}},
            {"name": "Asistente de Marketing", "dept": "Marketing", "is_r": False, "is_a": False, "perms": {}},
            # RRHH
            {"name": "Responsable de RRHH", "dept": "RRHH", "is_r": True, "is_a": False, "perms": {"rrhh": True}},
            {"name": "Técnico RRHH", "dept": "RRHH", "is_r": False, "is_a": False, "perms": {"rrhh": True}},
            # Dirección
            {"name": "Dirección", "dept": "Dirección", "is_r": True, "is_a": False, "perms": {"ventas": True, "compras": True, "produccion": True, "finanzas": True, "almacen": True, "inventario": True, "rrhh": True, "calidad": True, "admin": True}},
            # Logística
            {"name": "Responsable Logística", "dept": "Logística", "is_r": True, "is_a": False, "perms": {"inventario": True, "almacen": True}},
        ]

        pos_map = {}
        for p in positions:
            dept = dept_map[p["dept"]]
            pos = db.query(models.JobPosition).filter(models.JobPosition.name == p["name"], models.JobPosition.department_id == dept.id).first()
            if not pos:
                pos = models.JobPosition(
                    name=p["name"],
                    department_id=dept.id,
                    is_responsable=p["is_r"],
                    is_asistente=p["is_a"],
                    can_view_ventas=p["perms"].get("ventas", False),
                    can_view_compras=p["perms"].get("compras", False),
                    can_view_produccion=p["perms"].get("produccion", False),
                    can_view_finanzas=p["perms"].get("finanzas", False),
                    can_view_almacen=p["perms"].get("almacen", False),
                    can_view_inventario=p["perms"].get("inventario", False),
                    can_manage_users=p["perms"].get("admin", False),
                    can_view_rrhh=p["perms"].get("rrhh", False),
                    can_view_calidad=p["perms"].get("calidad", False)
                )
                db.add(pos)
                db.flush()
            pos_map[(p["dept"], p["name"])] = pos

        # 4. Create Users
        default_pwd = auth.get_password_hash("Cenvalsa")
        
        users_to_create = [
            # Ventas - Conectrónica
            {"user": "jose.cespedes", "email": "jose.cespedes@cenvalsa.com", "dept": "Ventas", "div": "Conectrónica", "pos": "Responsable de División"},
            {"user": "adrian.romero", "email": "adrian.romero@cenvalsa.com", "dept": "Ventas", "div": "Conectrónica", "pos": "Comercial"},
            {"user": "antonio.macho", "email": "antonio.macho@cenvalsa.com", "dept": "Ventas", "div": "Conectrónica", "pos": "Comercial"},
            {"user": "aaron.heredia", "email": "aaron.heredia@cenvalsa.com", "dept": "Ventas", "div": "Conectrónica", "pos": "Asistente Comercial"},
            # Ventas - Sismecánica
            {"user": "juancarlos.benito", "email": "juancarlos.benito@cenvalsa.com", "dept": "Ventas", "div": "Sismecánica", "pos": "Responsable de División"},
            {"user": "javier.allen", "email": "javier.allen@cenvalsa.com", "dept": "Ventas", "div": "Sismecánica", "pos": "Comercial"},
            {"user": "felix.gomez", "email": "felix.gomez@cenvalsa.com", "dept": "Ventas", "div": "Sismecánica", "pos": "Asistente Comercial"},
            {"user": "jaime.cesteros", "email": "jaime.cesteros@cenvalsa.com", "dept": "Ventas", "div": "Sismecánica", "pos": "Asistente Comercial"},
            # Ventas - Informática Industrial
            {"user": "juancarlos.valdes", "email": "juancarlos.valdes@cenvalsa.com", "dept": "Ventas", "div": "Informática Industrial", "pos": "Responsable de División"},
            {"user": "andrei.minca", "email": "andrei.minca@cenvalsa.com", "dept": "Ventas", "div": "Informática Industrial", "pos": "Asistente Comercial"},
            # Producción
            {"user": "alberto.perez", "email": "alberto.perez@cenvalsa.com", "dept": "Producción", "pos": "Responsable de Producción"},
            {"user": "carlos.meza", "email": "carlos.meza@cenvalsa.com", "dept": "Producción", "pos": "Operario de Producción"},
            {"user": "antonio.fernandez", "email": "antonio.fernandez@cenvalsa.com", "dept": "Producción", "pos": "Operario de Producción"},
            {"user": "juanjo.nuno", "email": "juanjo.nuno@cenvalsa.com", "dept": "Producción", "pos": "Operario de Producción"},
            {"user": "hector.massa", "email": "hector.massa@cenvalsa.com", "dept": "Producción", "pos": "Operario de Producción"},
            {"user": "jorge.nieto", "email": "jorge.nieto@cenvalsa.com", "dept": "Producción", "pos": "Operario de Producción"},
            # Compras
            {"user": "elena.lozano", "email": "elena.lozano@cenvalsa.com", "dept": "Compras", "pos": "Responsable de Compras"},
            {"user": "pao.tsai", "email": "pao.tsai@cenvalsa.com", "dept": "Compras", "pos": "Técnico de Compras"},
            {"user": "carmen.martin", "email": "carmen.martin@cenvalsa.com", "dept": "Compras", "pos": "Técnico de Compras"},
            {"user": "ana.querol", "email": "ana.querol@cenvalsa.com", "dept": "Compras", "pos": "Técnico de Compras"},
            # Marketing
            {"user": "marlene.barrientos", "email": "marlene.barrientos@cenvalsa.com", "dept": "Marketing", "pos": "Responsable de Marketing"},
            {"user": "paula.albarran", "email": "paula.albarran@cenvalsa.com", "dept": "Marketing", "pos": "Asistente de Marketing"},
            {"user": "gabriela.briceno", "email": "gabriela.briceno@cenvalsa.com", "dept": "Marketing", "pos": "Asistente de Marketing"},
            # IT
            {"user": "alfredo.rubio", "email": "alfredo.rubio@cenvalsa.com", "dept": "IT", "pos": "Responsable de IT"},
            {"user": "robert.calderon", "email": "robert.calderon@cenvalsa.com", "dept": "IT", "pos": "Técnico IT"},
            # RRHH
            {"user": "marivi.sanchez", "email": "marivi.sanchez@cenvalsa.com", "dept": "RRHH", "pos": "Responsable de RRHH"},
            {"user": "sergio.martinez", "email": "sergio.martinez@cenvalsa.com", "dept": "RRHH", "pos": "Técnico RRHH"},
            {"user": "maria.romero", "email": "maria.romero@cenvalsa.com", "dept": "RRHH", "pos": "Técnico RRHH"},
            # Contabilidad
            {"user": "teresa.garcia", "email": "teresa.garcia@cenvalsa.com", "dept": "Contabilidad", "pos": "Responsable de Contabilidad"},
            {"user": "isabel.reboloso", "email": "isabel.reboloso@cenvalsa.com", "dept": "Contabilidad", "pos": "Contable"},
            {"user": "angela.pardo", "email": "angela.pardo@cenvalsa.com", "dept": "Contabilidad", "pos": "Contable"},
            {"user": "jose.miguel", "email": "jose.miguel@cenvalsa.com", "dept": "Contabilidad", "pos": "Contable"},
            # Dirección
            {"user": "veronica.marino", "email": "veronica.marino@cenvalsa.com", "dept": "Dirección", "pos": "Dirección"},
            {"user": "joseluis.martin", "email": "joseluis.martin@cenvalsa.com", "dept": "Dirección", "pos": "Dirección"},
            {"user": "sara.macho", "email": "sara.macho@cenvalsa.com", "dept": "Dirección", "pos": "Dirección"},
            # Logística
            {"user": "ismael.gutierrez", "email": "ismael.gutierrez@cenvalsa.com", "dept": "Logística", "pos": "Responsable Logística"},
        ]

        for u in users_to_create:
            db_user = db.query(models.User).filter(models.User.username == u["user"]).first()
            if not db_user:
                pos = pos_map[(u["dept"], u["pos"])]
                div = div_map.get(u["div"]) if u.get("div") else None
                db_user = models.User(
                    username=u["user"],
                    email=u["email"],
                    hashed_password=default_pwd,
                    department_id=dept_map[u["dept"]].id,
                    division_id=div.id if div else None,
                    position_id=pos.id,
                    must_change_password=True
                )
                db.add(db_user)
        
        db.commit()
        print("Sincronización de departamentos, puestos y usuarios completada con éxito.")

    except Exception as e:
        db.rollback()
        print(f"Error durante el seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
