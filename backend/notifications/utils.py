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
        bon_commande=dossier.id_bc,
        type=Notification.Type.DOSSIER_ASSIGNE,
        titre="Dossier d'importation assigné",
        message=(
            f"Le dossier d'importation du {dossier.id_bc.reference} "
            f"vous a été assigné."
        ),
    )


def notifier_dossier_mis_a_jour(dossier):
    """
    Informe l'acheteur lorsqu'un transitaire modifie
    le dossier d'importation.
    """
    if not dossier.id_bc or not dossier.id_bc.id_acheteur:
        return

    Notification.objects.create(
        destinataire=dossier.id_bc.id_acheteur,
        bon_commande=dossier.id_bc,
        type=Notification.Type.BC_PRIS_EN_CHARGE,
        titre="Dossier d'importation mis à jour",
        message=(
            f"Le dossier d'importation du "
            f"{dossier.id_bc.reference} a été mis à jour "
            f"par le transitaire."
        ),
    )


def notifier_reception_validee(dossier):
    """
    Informe l'acheteur et le demandeur lorsque
    la réception de la marchandise est validée.
    """

    bc = dossier.id_bc

    if not bc:
        return

    # Notification à l'acheteur
    if bc.id_acheteur:
        Notification.objects.create(
            destinataire=bc.id_acheteur,
            bon_commande=bc,
            type=Notification.Type.LIVRAISON,
            titre="Marchandise livrée",
            message=(
                f"La réception de la marchandise du "
                f"{bc.reference} a été validée."
            ),
        )

    # Notification au demandeur
    if bc.id_da and bc.id_da.id_demandeur:
        Notification.objects.create(
            destinataire=bc.id_da.id_demandeur,
            demande=bc.id_da,
            bon_commande=bc,
            type=Notification.Type.LIVRAISON,
            titre="Marchandise livrée",
            message=(
                f"La marchandise liée à votre demande "
                f"{bc.id_da.reference} a été livrée."
            ),
        )