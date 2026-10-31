from django.conf import settings
from django.db.models import Exists, OuterRef

# Pièces à déposer avant que le dossier puisse être envoyé au contrôleur.
TYPES_OBLIGATOIRES = ('facture', 'colisage', 'origine', 'transport')


def exiger_pieces():
    return getattr(settings, 'EXIGER_PIECES_OBLIGATOIRES', True)


def masquer_sans_pieces(qs, statut_a_verifier):
    """Retire d'un queryset de dossiers ceux qui sont à vérifier mais auxquels il
    manque une pièce obligatoire. Les dossiers déjà décidés restent visibles."""
    if not exiger_pieces():
        return qs
    from .models import DocumentDossier

    for type_piece in TYPES_OBLIGATOIRES:
        nom = f'piece_{type_piece}'
        qs = qs.annotate(**{nom: Exists(
            DocumentDossier.objects.filter(id_dossier=OuterRef('pk'), type=type_piece)
        )})
        qs = qs.exclude(statut_controle=statut_a_verifier, **{nom: False})
    return qs
