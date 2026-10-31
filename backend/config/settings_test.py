from .settings import *  # noqa: F401,F403

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Les tables de test sont créées directement depuis les modèles.
MIGRATION_MODULES = {
    'authentication': None,
    'produits': None,
    'demandes': None,
    'commandes': None,
    'notifications': None,
}

# Les anciens tests ne déposent pas de pièces : la règle a ses propres tests.
EXIGER_PIECES_OBLIGATOIRES = False
