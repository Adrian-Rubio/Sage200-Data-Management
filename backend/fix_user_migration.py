import unicodedata
from database import SessionLocal
from models import User, Department, Division, JobPosition

def normalize_text(text):
    if not text: return ""
    return "".join(
        c for c in unicodedata.normalize('NFD', text)
        if unicodedata.category(c) != 'Mn'
    ).lower().replace(" ", ".")

def fix_migration():
    db = SessionLocal()
    try:
        target_hierarchy = [
            ("Adrián Romero", "Ventas", "Conectrónica", "Comercial"),
            ("Antonio macho", "Ventas", "Conectrónica", "Comercial"),
            ("Jose cespedes", "Ventas", "Conectrónica", "Responsable de División"),
            ("Juan carlos benito", "Ventas", "Sismecánica", "Comercial"),
            ("Jesus collado", "Ventas", "Conectrónica", "Comercial"),
            ("Adrián Rubio", "Ventas", "Dirección", "Responsable de Departamento"),
            ("Pao Tsai", "Compras", "Aprovisionamiento", "Responsable de División"),
            ("Carmen Martín", "Compras", "Aprovisionamiento", "Comercial"),
            ("Ana Querol", "Compras", "Aprovisionamiento", "Comercial"),
            ("Antonio Fernandez", "Almacén", "Almacén", "Responsable de División"),
            ("Carlos Meza", "Almacén", "Almacén", "Operario"),
            ("Juanjo Nuño", "Almacén", "Almacén", "Operario"),
            ("Hector Massa", "Almacén", "Almacén", "Operario"),
            ("Jorge Nieto", "Almacén", "Almacén", "Operario"),
            ("Marivi Sanchez", "Administración", "Contabilidad", "Responsable de División"),
            ("Sergio Martinez", "Administración", "Contabilidad", "Administrativo"),
            ("Maria Romero", "Administración", "Contabilidad", "Administrativo"),
            ("Isabel", "RRHH", "RRHH", "Responsable de División"),
            ("Alfredo Rubio", "RRHH", "RRHH", "Dirección"),
            ("Veronica Marino", "Atención al Cliente", "Atención al Cliente", "Asistente"),
            ("Sara Macho", "Atención al Cliente", "Atención al Cliente", "Asistente"),
            ("Teresa Garcia", "Calidad", "Post-venta y RMA", "Responsable de División"),
            ("Isabel Reboloso", "Calidad", "Post-venta y RMA", "Asistente"),
            ("Jose Miguel", "Calidad", "Post-venta y RMA", "Asistente"),
            ("Marlene Barrientos", "Dirección", "Secretaría Dirección", "Responsable de División"),
            ("Paula Albarran", "Dirección", "Secretaría Dirección", "Asistente"),
            ("Gabriela Briceño", "Dirección", "Secretaría Dirección", "Asistente"),
            ("Felix", "Gerencia", "Gerencia", "Gerente"),
            ("Robert Calderon", "Sistemas", "Sistemas", "Responsable de División"),
        ]

        all_users = db.query(User).all()
        
        for name, dept_name, div_name, pos_name in target_hierarchy:
            norm_name = normalize_text(name)
            
            # Find matching users
            matching_users = [u for u in all_users if normalize_text(u.username) == norm_name or normalize_text(u.email.split("@")[0] if u.email else "") == norm_name]
            if not matching_users: continue

            # Ensure Dept exists
            dept = db.query(Department).filter(Department.name.like(f"%{dept_name}%")).first()
            if not dept:
                dept = Department(name=f"Cenvalsa - {dept_name}")
                db.add(dept)
                db.flush()
            
            # Ensure Division exists
            div = db.query(Division).filter(Division.name == div_name, Division.department_id == dept.id).first()
            if not div:
                div = Division(name=div_name, department_id=dept.id)
                db.add(div)
                db.flush()
                
            # Ensure Position exists
            pos = db.query(JobPosition).filter(JobPosition.name == pos_name, JobPosition.department_id == dept.id).first()
            if not pos:
                pos = JobPosition(name=pos_name, department_id=dept.id, is_responsable=("Responsable" in pos_name or "Gerente" in pos_name))
                db.add(pos)
                db.flush()

            # Merge and sync
            matching_users.sort(key=lambda x: x.id)
            primary_user = matching_users[0]
            primary_user.department_id = dept.id
            primary_user.division_id = div.id
            primary_user.position_id = pos.id
            
            print(f"Sincronizado: {primary_user.username} -> {dept.name} / {div.name}")
            
            for other in matching_users[1:]:
                if other.id != primary_user.id:
                    db.delete(other)

        db.commit()
        print("Sincronización finalizada.")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_migration()
