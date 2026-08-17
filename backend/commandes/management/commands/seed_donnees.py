import datetime

from django.db import models
from django.core.management.base import BaseCommand

from authentication.models import Employe
from produits.models import Fournisseur, Produit
from demandes.models import DemandeAchat, LigneDemandeAchat

# (nom_fournisseur, adresse_fournisseur, tel_fournisseur)
FOURNISSEURS = [
    ('ALFATRON', 'Zone industrielle Alger', 21321234567),
    ('Bureau Plus', 'Rue des Frères Boudiaf, Alger', 21321567890),
    ('Électro Plus', 'Haï El Badr, Alger', 21321222233),
    ('Mobili Algérie', 'Chéraga, Alger', 21321444556),
    ('Clima Tech', 'Bab Ezzouar, Alger', 21321333444),
    ('Green Supply', 'Dely Brahim, Alger', 21321666777),
    ('Paper & Co', 'Hussein Dey, Alger', 21321888999),
]

# (nom, fournisseur, prix_unit) — prix indicatifs du marché algérien (DZD)
PRODUITS = [
    ('PC ALFATRON', 'ALFATRON', 85000),
    ('PC Portable', 'ALFATRON', 150000),
    ('Clavier', 'ALFATRON', 2500),
    ('Souris', 'ALFATRON', 1500),
    ('Rallonge', 'Électro Plus', 1200),
    ('Porte', 'Mobili Algérie', 25000),
    ('Casier', 'Mobili Algérie', 35000),
    ('Chaise', 'Mobili Algérie', 8000),
    ('Table', 'Mobili Algérie', 30000),
    ('Bureau', 'Mobili Algérie', 80000),
    ('Climatiseur', 'Clima Tech', 75000),
    ('Plante', 'Green Supply', 3500),
    ('Stylo', 'Paper & Co', 300),
    ('Cahier', 'Paper & Co', 350),
]

# Demandes acceptées : (numero_da, objet, [(nom_produit, qte), ...])
DEMANDES = [
    ('DA-ALG-2026-001', 'Équipement informatique', [
        ('PC ALFATRON', 5),
        ('Clavier', 10),
        ('Souris', 10),
        ('Rallonge', 10),
    ]),
    ('DA-ALG-2026-002', 'Aménagement des bureaux', [
        ('Porte', 2),
        ('Casier', 4),
        ('Chaise', 15),
        ('Table', 5),
    ]),
    ('DA-ALG-2026-003', 'Confort et climatisation', [
        ('Climatiseur', 3),
    ]),
    ('DA-ALG-2026-004', 'Fournitures de bureau', [
        ('Stylo', 50),
        ('Cahier', 40),
    ]),
]


class Command(BaseCommand):
    help = 'Insère des données de démonstration (fournisseurs, catégories, produits, demandes acceptées).'

    def handle(self, *args, **options):
        # Fournisseurs
        fournisseurs = {}
        for nom, adresse, tel in FOURNISSEURS:
            f, _ = Fournisseur.objects.get_or_create(
                nom_fournisseur=nom,
                defaults={'adresse_fournisseur': adresse, 'tel_fournisseur': tel},
            )
            fournisseurs[nom] = f

        # Produits (num_produit n'est pas auto-incrémenté dans la table → fourni manuellement)
        produits = {}
        next_num = (Produit.objects.aggregate(m=models.Max('num_produit'))['m'] or 0) + 1
        for nom, fournisseur_nom, prix in PRODUITS:
            p = Produit.objects.filter(nom_produit=nom).first()
            if not p:
                p = Produit.objects.create(
                    num_produit=next_num,
                    nom_produit=nom,
                    prix_unit=prix,
                    id_fournisseur=fournisseurs[fournisseur_nom],
                )
                next_num += 1
            else:
                p.prix_unit = prix
                p.id_fournisseur = fournisseurs[fournisseur_nom]
                p.save()
            produits[nom] = p

        # Demandeur de démo
        demandeur = Employe.objects.filter(role='demandeur').first()

        # Demandes acceptées + lignes
        for numero, objet, lignes in DEMANDES:
            da, created = DemandeAchat.objects.get_or_create(
                numero_da=numero,
                defaults={
                    'dot': 'Alger-Centre',
                    'id_demandeur': demandeur,
                    'date_creation': datetime.date.today(),
                    'objet': objet,
                    'statut': DemandeAchat.Statut.APPROUVEE,
                },
            )
            if created:
                for nom_produit, qte in lignes:
                    produit = produits[nom_produit]
                    LigneDemandeAchat.objects.create(
                        id_da=da,
                        id_produit=produit,
                        designation=produit.nom_produit,
                        qte=qte,
                        prix_unit=produit.prix_unit,
                    )

        self.stdout.write(self.style.SUCCESS(
            f'OK : {Fournisseur.objects.count()} fournisseurs, '
            f'{Produit.objects.count()} produits, {DemandeAchat.objects.count()} demandes.'
        ))
