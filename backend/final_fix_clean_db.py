from database import SessionLocal
from models import User, Department, Division, JobPosition, Company
from sqlalchemy import text
import auth as auth_helper

def clean_and_seed():
    db = SessionLocal()
    try:
        print("Limpiando base de datos jerárquica...")
        
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
                is_resp = "Responsable" in pos_name or "Gerencia" in pos_name or "Dirección" in pos_name
                is_asist = "Asistente" in pos_name or "Soporte" in pos_name
                
                pos = JobPosition(
                    name=pos_name, 
                    department_id=dept.id,
                    is_responsable=is_resp,
                    is_asistente=is_asist,
                    # Default permissions based on Dept
                    can_view_ventas=(d_name == "Departamento de Ventas" or is_resp or d_name == "Departamento de IT"),
                    can_view_compras=(d_name in ["Departamento de Ventas", "Departamento de Compras y Ventas", "Departamento de Producción"] or is_resp or d_name == "Departamento de IT"),
                    can_view_produccion=(d_name == "Departamento de Producción" or is_resp or d_name == "Departamento de IT"),
                    can_view_finanzas=(d_name == "Departamento de Contabilidad" or is_resp or d_name == "Departamento de IT"),
                    can_view_almacen=(d_name == "Departamento Logístico" or d_name == "Departamento de Producción" or is_resp or d_name == "Departamento de IT"),
                    can_view_inventario=(d_name in ["Departamento de Ventas", "Departamento de Compras y Ventas", "Departamento de Producción", "Departamento Logístico", "Departamento de Dirección", "Departamento de IT"] or is_resp),
                    can_manage_users=(is_resp and d_name in ["Departamento de IT", "Departamento de RRHH"]) or d_name == "Departamento de IT"
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
            # Saratur
            ("merce.arbona", "Departamento de Dirección", "Dirección", "Gerencia"),
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
                
                # Company assignment
                if username == "merce.arbona":
                    user.company_id = company_objects["SARATUR"].id
                else:
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

