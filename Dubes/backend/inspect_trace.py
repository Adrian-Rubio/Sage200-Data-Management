from database import engine
import sqlalchemy as sa

md = sa.MetaData()
md.reflect(bind=engine)
sales = md.tables['Sales']
elements = md.tables['Elements']
maps = md.tables['Maps']
locals_t = md.tables['Locals']

with engine.connect() as conn:
    query = sa.select(sales.c.Id, elements.c.Name, maps.c.Name, locals_t.c.Name).select_from(
        sales.join(elements, sales.c.ElementId == elements.c.Id)
             .join(maps, elements.c.MapId == maps.c.Id)
             .join(locals_t, maps.c.LocalId == locals_t.c.Id)
    ).limit(5)
    res = conn.execute(query).fetchall()
    print("Trace Sale -> Element -> Map -> Local:")
    for r in res:
        print(r)
