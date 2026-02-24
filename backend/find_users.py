import sys; sys.path.insert(0, '.')
from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    r = conn.execute(text("SELECT id, username, email, role, is_active FROM dashboard_users"))
    rows = r.fetchall()
    cols = list(r.keys())
    print('Usuarios del dashboard:')
    for row in rows:
        print(' ', dict(zip(cols, row)))
