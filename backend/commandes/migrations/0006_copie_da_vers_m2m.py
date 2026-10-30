from django.db import migrations


def copier(apps, schema_editor):
    BonDeCommande = apps.get_model('commandes', 'BonDeCommande')
    for bc in BonDeCommande.objects.filter(id_da__isnull=False):
        bc.demandes.add(bc.id_da_id)


class Migration(migrations.Migration):
    dependencies = [('commandes', '0005_bc_demandes_m2m')]
    operations = [migrations.RunPython(copier, migrations.RunPython.noop)]
