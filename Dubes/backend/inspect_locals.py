from database import engine
import sqlalchemy as sa

md = sa.MetaData()
md.reflect(bind=engine)

with engine.connect() as conn:
    print("Tables:")
    print([t for t in md.tables.keys() if 'Comp' in t or 'Local' in t or 'Store' in t])
    if 'Companies' in md.tables:
        comp = md.tables['Companies']
        res = conn.execute(sa.select(comp.c.Id, comp.c.Name)).fetchall()
        print("\nCompanies:")
        for r in res:
            print(r)
