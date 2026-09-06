from .models import Notification


def notifier_da_assignee(demande):
    if not demande.id_demandeur or not demande.id_acheteur:
        return

    Notification.objects.create(
        destinataire=demande.id_demandeur,
        demande=demande,
        type=Notification.Type.DA_ASSIGNEE,
        titre='Demande prise en charge',
        message=(
            f'Votre demande {demande.reference} '
            f'est maintenant prise en charge par '
            f'{demande.id_acheteur.full_name}.'
        ),
    )


def notifier_da_approuvee(demande):
    if not demande.id_demandeur:
        return

    Notification.objects.create(
        destinataire=demande.id_demandeur,
        demande=demande,
        type=Notification.Type.DA_APPROUVEE,
        titre='Demande approuvée',
        message=(
            f'Votre demande {demande.reference} '
            f'a été approuvée.'
        ),
    )


def notifier_da_refusee(demande, motif=''):
    if not demande.id_demandeur:
        return

    message = f'Votre demande {demande.reference} a été refusée.'

    if motif:
        message += f' Motif : {motif}'

    Notification.objects.create(
        destinataire=demande.id_demandeur,
        demande=demande,
        type=Notification.Type.DA_REFUSEE,
        titre='Demande refusée',
        message=message,
    )


def notifier_dossier_assigne(dossier):
    if not dossier.id_transitaire:
        return

    Notification.objects.create(
        destinataire=dossier.id_transitaire,
        type=Notification.Type.DOSSIER_ASSIGNE,
        titre="Dossier d'importation assigné",
        message=(
            f"Le dossier d'importation du {dossier.id_bc.reference} "
            f"vous a été assigné."
        ),
    )