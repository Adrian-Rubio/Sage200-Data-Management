from database import SessionLocal
from models import User, Department, Division, JobPosition, Company
from sqlalchemy import text
import auth as auth_helper

def clean_and_seed():
    db = SessionLocal()
    try:
        print("Limpiando base de datos jerárquica...")

        # Migración: añadir columna duration_minutes si no existe (SQL Server)
        try:
            db.execute(text("ALTER TABLE dashboard_vacations ADD duration_minutes INT NULL"))
            db.commit()
            print("Migración: columna duration_minutes añadida.")
        except Exception:
            pass  # La columna ya existe

        
        # Eliminar usuarios no deseados y sus vacaciones asociadas
        unwanted_usernames = [
            "admin", "distribuidor", "socio", 
            "felix", "felix.gomez", 
            "isabel", "isabel.reboloso", 
            "jose.miguel", 
            "teresa", "teresa.garcia", 
            "veronica", "veronica.marino",
            "juan.benito", "juan.valdes"
        ]
        usernames_str = ", ".join(f"'{u}'" for u in unwanted_usernames)
        db.execute(text(f"DELETE FROM dashboard_vacations WHERE user_id IN (SELECT id FROM dashboard_users WHERE username IN ({usernames_str}))"))
        db.execute(text(f"DELETE FROM dashboard_users WHERE username IN ({usernames_str})"))
        db.commit()

        # We nullify foreign keys in users first to avoid constraint issues during deletion
        db.execute(text("UPDATE dashboard_users SET department_id = NULL, division_id = NULL, position_id = NULL, company_id = NULL"))
        db.commit()
        
        # Delete existing hierarchy
        db.query(JobPosition).delete()
        db.query(Division).delete()
        db.query(Department).delete()
        db.query(Company).delete()
        db.commit()

        print("Creando compañías...")
        companies = {
            "CENVAL": "CENVAL S.L.",
            "CENVALSA_IND": "CENVALSA INDUSTRIAL S.L.",
            "SARATUR": "SARATUR S.L."
        }
        company_objects = {}
        for code, name in companies.items():
            co = Company(code=code, name=name)
            db.add(co)
            db.flush()
            company_objects[code] = co

        # Ensure merce.arbona exists
        merce = db.query(User).filter(User.username == "merce.arbona").first()
        if not merce:
            print("Creando usuario merce.arbona...")
            hashed_pwd = auth_helper.get_password_hash("merce123")
            merce = User(
                username="merce.arbona",
                email="merce.arbona@cenvalsa.com",
                hashed_password=hashed_pwd,
                role="comercial",
                user_type="CENVAL",
                is_active=True,
                must_change_password=True
            )
            db.add(merce)
            db.flush()

        print("Creando nueva estructura basada en el Glosario Final...")

        # Structure Definition
        structure = {
            "Departamento de Ventas": {
                "divisions": ["División Conectrónica", "División Sismecánica", "División Informática Industrial"],
                "positions": ["Responsable de División", "Comercial", "Asistente"]
            },
            "Departamento de Producción": {
                "divisions": ["Producción"],
                "positions": ["Responsable", "Operario"]
            },
            "Departamento de Compras y Ventas": {
                "divisions": ["Compras y Ventas"],
                "positions": ["Responsable", "Comercial"]
            },
            "Departamento de Marketing": {
                "divisions": ["Marketing"],
                "positions": ["Responsable", "Asistente"]
            },
            "Departamento de IT": {
                "divisions": ["IT"],
                "positions": ["Responsable", "Administrador Sistemas", "Soporte"]
            },
            "Departamento de RRHH": {
                "divisions": ["RRHH"],
                "positions": ["Responsable", "Administrativo"]
            },
            "Departamento de Contabilidad": {
                "divisions": ["Contabilidad"],
                "positions": ["Responsable", "Administrativo"]
            },
            "Departamento de Dirección": {
                "divisions": ["Dirección"],
                "positions": ["Dirección", "Gerencia"]
            },
            "Departamento Logístico": {
                "divisions": ["Logística"],
                "positions": ["Logístico"]
            },
            "Departamento de Saratur": {
                "divisions": ["Saratur"],
                "positions": ["Gerencia Saratur"]
            }
        }

        # Create Depts, Divs, and common positions
        dept_objects = {}
        div_objects = {}
        pos_objects = {} # key: (dept_id, pos_name)

        for d_name, details in structure.items():
            dept = Department(name=d_name)
            db.add(dept)
            db.flush()
            dept_objects[d_name] = dept

            for div_name in details["divisions"]:
                div = Division(name=div_name, department_id=dept.id)
                db.add(div)
                db.flush()
                div_objects[f"{d_name}/{div_name}"] = div

            for pos_name in details["positions"]:
                is_resp = "Responsable" in pos_name or "Gerencia" in pos_name or "Director" in pos_name
                is_asist = "Asistente" in pos_name or "Soporte" in pos_name

                # Permisos por departamento — explícitos, sin escalado por is_responsable
                is_it      = d_name == "Departamento de IT"
                is_dir     = d_name == "Departamento de Dirección"
                is_ventas  = d_name == "Departamento de Ventas"
                is_compras = d_name == "Departamento de Compras y Ventas"
                is_prod    = d_name == "Departamento de Producción"
                is_logis   = d_name == "Departamento Logístico"
                is_cont    = d_name == "Departamento de Contabilidad"
                is_mkt     = d_name == "Departamento de Marketing"
                is_rrhh    = d_name == "Departamento de RRHH"
                is_saratur = d_name == "Departamento de Saratur"  # Solo acceso Saratur (via dept en users.py)

                pos = JobPosition(
                    name=pos_name,
                    department_id=dept.id,
                    is_responsable=is_resp,
                    is_asistente=is_asist,
                    # Permisos estrictos por departamento
                    # Dirección: acceso completo excepto admin/usuarios
                    can_view_ventas    = is_it or is_dir or is_ventas,
                    can_view_compras   = is_it or is_dir or is_ventas or is_compras or is_prod,
                    # Ventas también tiene producción (sol. #3)
                    can_view_produccion= is_it or is_dir or is_prod or is_ventas,
                    can_view_finanzas  = is_it or is_dir or is_cont,
                    # Producción pierde almacen (sol. #4); Dirección lo conserva
                    can_view_almacen   = is_it or is_dir or is_logis,
                    can_view_inventario= is_it or is_dir or is_ventas or is_compras or is_prod or is_logis,
                    # Dirección y IT tienen RRHH (sol. #1)
                    can_view_rrhh      = is_it or is_rrhh or is_dir,
                    can_view_calidad   = is_it,
                    # Saratur: solo acceso a su módulo (gestionado en users.py via departamento)
                    # Marketing: acceso a Saratur via departamento en users.py (no requiere campo)
                    # Saratur dept: cero permisos de módulos — solo saratur via dept check en token
                    can_manage_users   = is_it,  # SOLO IT gestiona usuarios
                )
                db.add(pos)
                db.flush()
                pos_objects[(dept.id, pos_name)] = pos

        # USERS MAPPING
        users_list = [
            # Ventas - Conectronica
            ("jose.cespedes", "Departamento de Ventas", "División Conectrónica", "Responsable de División"),
            ("adrian.romero", "Departamento de Ventas", "División Conectrónica", "Comercial"),
            ("antonio.macho", "Departamento de Ventas", "División Conectrónica", "Comercial"),
            ("aaron.heredia", "Departamento de Ventas", "División Conectrónica", "Asistente"),
            # Ventas - Sismecanica
            ("juancarlos.benito", "Departamento de Ventas", "División Sismecánica", "Responsable de División"),
            ("javier.allen", "Departamento de Ventas", "División Sismecánica", "Comercial"),
            ("jaime.cesteros", "Departamento de Ventas", "División Sismecánica", "Asistente"),
            # Ventas - Informatica Industrial
            ("juancarlos.valdes", "Departamento de Ventas", "División Informática Industrial", "Responsable de División"),
            ("andrei.minca", "Departamento de Ventas", "División Informática Industrial", "Asistente"),
            # Produccion
            ("alberto.perez", "Departamento de Producción", "Producción", "Responsable"),
            ("carlos.meza", "Departamento de Producción", "Producción", "Operario"),
            ("antonio.fernandez", "Departamento de Producción", "Producción", "Operario"),
            ("juanjo.nuno", "Departamento de Producción", "Producción", "Operario"),
            ("hector.massa", "Departamento de Producción", "Producción", "Operario"),
            ("jorge.nieto", "Departamento de Producción", "Producción", "Operario"),
            # Compras
            ("elena.lozano", "Departamento de Compras y Ventas", "Compras y Ventas", "Responsable"),
            ("pao.tsai", "Departamento de Compras y Ventas", "Compras y Ventas", "Comercial"),
            ("carmen.martin", "Departamento de Compras y Ventas", "Compras y Ventas", "Comercial"),
            ("ana.querol", "Departamento de Compras y Ventas", "Compras y Ventas", "Comercial"),
            # Marketing
            ("marlene.barrientos", "Departamento de Marketing", "Marketing", "Responsable"),
            ("paula.albarran", "Departamento de Marketing", "Marketing", "Asistente"),
            ("gabriela.briceno", "Departamento de Marketing", "Marketing", "Asistente"),
            # IT
            ("alfredo.rubio", "Departamento de IT", "IT", "Responsable"),
            ("adrian.rubio", "Departamento de IT", "IT", "Administrador Sistemas"),
            ("robert.calderon", "Departamento de IT", "IT", "Soporte"),
            # RRHH
            ("marivi.sanchez", "Departamento de RRHH", "RRHH", "Responsable"),
            ("sergio.martinez", "Departamento de RRHH", "RRHH", "Administrativo"),
            ("maria.romero", "Departamento de RRHH", "RRHH", "Administrativo"),
            # Contabilidad
            ("angela.pardo", "Departamento de Contabilidad", "Contabilidad", "Administrativo"),
            ("josem.fernandez", "Departamento de Contabilidad", "Contabilidad", "Administrativo"),
            # Direccion
            ("joseluis.martin", "Departamento de Dirección", "Dirección", "Dirección"),
            ("sara", "Departamento de Dirección", "Dirección", "Gerencia"),
            # Logistico
            ("ismael.gutierrez", "Departamento Logístico", "Logística", "Logístico"),
            # Saratur — departamento propio, sin permisos de otros módulos
            ("merce.arbona", "Departamento de Saratur", "Saratur", "Gerencia Saratur"),
        ]

        dept_to_company = {
            "Departamento de Dirección": "CENVAL",
            "Departamento de IT": "CENVAL",
            "Departamento de Contabilidad": "CENVAL",
            "Departamento de RRHH": "CENVAL",
            "Departamento de Marketing": "CENVAL",
            "Departamento de Ventas": "CENVALSA_IND",
            "Departamento de Compras y Ventas": "CENVALSA_IND",
            "Departamento de Producción": "CENVALSA_IND",
            "Departamento Logístico": "CENVALSA_IND",
            "Departamento de Saratur": "SARATUR",
        }

        for username, d_name, div_name, pos_name in users_list:
            user = db.query(User).filter(User.username == username).first()
            if user:
                dept = dept_objects[d_name]
                div = div_objects[f"{d_name}/{div_name}"]
                pos = pos_objects[(dept.id, pos_name)]
                
                user.department_id = dept.id
                user.division_id = div.id
                user.position_id = pos.id
                
                # Company assignment — ya está en dept_to_company para todos
                comp_code = dept_to_company.get(d_name)
                if comp_code:
                    user.company_id = company_objects[comp_code].id

                print(f"Asignado: {username} -> {d_name} ({pos_name}) [Company: {user.company_id}]")
            else:
                print(f"ADVERTENCIA: Usuario no encontrado en DB: {username}")

        db.commit()
        print("¡Base de datos jerárquica reseteada y poblada correctamente!")

    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    clean_and_seed()

