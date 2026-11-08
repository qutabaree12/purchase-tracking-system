from django.db import migrations, models


def corriger_integrite_postgres(apps, schema_editor):
    if schema_editor.connection.vendor != 'postgresql':
        return
    with schema_editor.connection.cursor() as cursor:
        cursor.execute('ALTER TABLE "BonDeCommande" ALTER COLUMN id_da DROP NOT NULL;')
        cursor.execute(
            """
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Ligne de BonDeCommande'
      AND column_name = 'num_ligne_bc'
      AND column_default IS NOT NULL
  ) THEN
    CREATE SEQUENCE IF NOT EXISTS ligne_bc_num_seq;
    ALTER TABLE "Ligne de BonDeCommande"
      ALTER COLUMN num_ligne_bc SET DEFAULT nextval('ligne_bc_num_seq');
    PERFORM setval(
      'ligne_bc_num_seq',
      COALESCE((SELECT MAX(num_ligne_bc) FROM "Ligne de BonDeCommande"), 0) + 1,
      false
    );
  END IF;
END $$;
"""
        )


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0004_alter_employe_role'),
        ('commandes', '0009_reception_lignereception'),
    ]

    operations = [
        migrations.RunPython(corriger_integrite_postgres, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name='dossierimportation',
            constraint=models.UniqueConstraint(
                condition=models.Q(('numero_lc', ''), _negated=True),
                fields=('numero_lc',),
                name='unique_numero_lc_non_vide',
            ),
        ),
    ]
