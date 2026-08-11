import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from django.db import connection
c = connection.cursor()
c.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")
tables = [r[0] for r in c.fetchall()]
print('TABLES:', tables)

for t in tables:
    c.execute(
        "SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint "
        "WHERE conrelid = %s::regclass",
        ['"' + t.replace('"', '""') + '"'],
    )
    rows = c.fetchall()
    print(f'== {t} ==')
    for name, definition in rows:
        print(f'   {name}: {definition}')
