import datetime

from django.db import transaction
from django.db.models import Sum

from notifications.utils import notifier_reception_partielle, notifier_reception_validee

from .models import DossierImportation, LigneReception, Reception

Statut = DossierImportation.Statut
Controle = DossierImportation.StatutControle


class ReceptionInvalide(Exception):
    """Règle métier non respectée : le message est montré tel quel à l'utilisateur."""


def solde_lignes(dossier):
    """Pour chaque ligne du BC : quantité commandée, déjà reçue, restante."""
    recues = dict(
        LigneReception.objects.filter(id_reception__id_dossier=dossier)
        .order_by()
        .values_list('ligne_bc')
        .annotate(total=Sum('quantite_recue'))
    )
    resultat = []
    for ligne in dossier.id_bc.lignes.select_related('num_produit').order_by('num_ligne_bc'):
        commande = ligne.qte or 0
        recu = recues.get(ligne.pk, 0)
        resultat.append({
            'num_ligne_bc': ligne.pk,
            'produit_nom': ligne.num_produit.nom_produit,
            'commande': commande,
            'recu': recu,
            'restant': max(commande - recu, 0),
        })
    return resultat


def verifier_receptionnable(dossier):
    """Mêmes règles que l'ancienne validation de réception."""
    if dossier.statut == Statut.LIVRE:
        raise ReceptionInvalide('La réception de ce dossier a déjà été validée.')
    if dossier.statut != Statut.EN_COURS:
        raise ReceptionInvalide("Le dossier doit être en cours pour enregistrer une réception.")
    if dossier.statut_controle != Controle.VALIDE:
        raise ReceptionInvalide(
            "Le contrôle du dossier doit être validé avant de poursuivre le processus."
        )
    if dossier.autorisation_necessaire and not dossier.autorisation_obtenue:
        raise ReceptionInvalide("Une autorisation est nécessaire et n'a pas encore été obtenue.")


def _marquer_livre(dossier):
    dossier.date_reception_reelle = datetime.date.today()
    dossier.statut = Statut.LIVRE
    dossier.save(update_fields=['date_reception_reelle', 'statut'])
    notifier_reception_validee(dossier)


def enregistrer_reception(dossier_id, transitaire, lignes, remarque=''):
    """Enregistre une réception (totale ou partielle).

    Retourne (dossier, complet). Lève ReceptionInvalide si une règle n'est pas respectée."""
    with transaction.atomic():
        # Verrou : deux réceptions simultanées ne peuvent pas dépasser la quantité commandée.
        dossier = DossierImportation.objects.select_for_update().get(pk=dossier_id)
        verifier_receptionnable(dossier)

        solde = {l['num_ligne_bc']: l for l in solde_lignes(dossier)}
        if not solde:
            raise ReceptionInvalide("Ce bon de commande n'a aucune ligne à réceptionner.")
        if not isinstance(lignes, list) or not lignes:
            raise ReceptionInvalide("Indiquez au moins une ligne reçue.")

        demandes = {}
        for item in lignes:
            try:
                numero = int(item['num_ligne_bc'])
                quantite = int(item['quantite'])
            except (KeyError, TypeError, ValueError):
                raise ReceptionInvalide('Une ligne de réception est invalide.')
            if quantite < 1:
                raise ReceptionInvalide('Les quantités reçues doivent être supérieures à zéro.')
            if numero in demandes:
                raise ReceptionInvalide('Une même ligne est indiquée deux fois.')
            if numero not in solde:
                raise ReceptionInvalide("Une ligne indiquée n'appartient pas à ce bon de commande.")
            if quantite > solde[numero]['restant']:
                raise ReceptionInvalide(
                    f"{solde[numero]['produit_nom']} : {quantite} reçu(s) dépasse(nt) "
                    f"le reste à recevoir ({solde[numero]['restant']})."
                )
            demandes[numero] = (quantite, str(item.get('reserve') or '').strip()[:255])

        remarque = str(remarque or '').strip()
        if len(remarque) > 500:
            raise ReceptionInvalide('La remarque ne doit pas dépasser 500 caractères.')

        reception = Reception.objects.create(
            id_dossier=dossier,
            id_transitaire=transitaire,
            date_reception=datetime.date.today(),
            remarque=remarque,
        )
        for numero, (quantite, reserve) in demandes.items():
            LigneReception.objects.create(
                id_reception=reception, ligne_bc_id=numero,
                quantite_recue=quantite, reserve=reserve,
            )

        complet = all(
            solde[n]['restant'] - demandes.get(n, (0, ''))[0] == 0 for n in solde
        )
        if complet:
            _marquer_livre(dossier)
        else:
            notifier_reception_partielle(dossier, reception)
        return dossier, complet


def enregistrer_reception_complete(dossier, transitaire):
    """Réceptionne d'un coup tout le reste à recevoir (bouton « Valider la réception »).
    À appeler dans une transaction, dossier déjà verrouillé et vérifié."""
    restantes = [l for l in solde_lignes(dossier) if l['restant'] > 0]
    if restantes:
        reception = Reception.objects.create(
            id_dossier=dossier,
            id_transitaire=transitaire,
            date_reception=datetime.date.today(),
            remarque='Réception du reste de la commande.',
        )
        for ligne in restantes:
            LigneReception.objects.create(
                id_reception=reception, ligne_bc_id=ligne['num_ligne_bc'],
                quantite_recue=ligne['restant'],
            )
    _marquer_livre(dossier)
