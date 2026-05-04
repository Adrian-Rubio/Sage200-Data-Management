from database import engine
import sqlalchemy as sa

md = sa.MetaData()
md.reflect(bind=engine)
tpvs = md.tables['Tpvs']

with engine.connect() as conn:
    res = conn.execute(sa.select(tpvs.c.Id, tpvs.c.Name)).fetchall()
    print('TPVs:')
    for r in res:
        print(r)
