from django.db import migrations
from django.contrib.auth.hashers import make_password

# Préfixes reconnus par Django comme mots de passe déjà hachés
HASH_PREFIXES = ('pbkdf2_', 'bcrypt', 'argon2', 'scrypt')


def hash_existing_passwords(apps, schema_editor):
    Employe = apps.get_model('authentication', 'Employe')
    for emp in Employe.objects.all():
        pwd = emp.mot_de_passe or ''
        if pwd and not pwd.startswith(HASH_PREFIXES):
            emp.mot_de_passe = make_password(pwd)
            emp.save(update_fields=['mot_de_passe'])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(hash_existing_passwords, noop),
    ]
