from database import engine, get_db
import models, auth
from sqlalchemy.orm import Session

def create_admin_user():
    # Ensure tables exist
    models.Base.metadata.create_all(bind=engine)
    db: Session = next(get_db())
    db_user = db.query(models.User).filter(models.User.username == "admin").first()
    if not db_user:
        hashed_password = auth.get_password_hash("admin123")
        admin = models.User(
            username="admin",
            email="admin@sage.com",
            hashed_password=hashed_password,
            role="admin",
            sales_rep_id=None,
            is_active=True
        )
        db.add(admin)
        db.commit()
        print("Admin user created! Username: admin | Password: admin123")
    else:
        print("Admin user already exists.")

if __name__ == "__main__":
    create_admin_user()
