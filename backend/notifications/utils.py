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