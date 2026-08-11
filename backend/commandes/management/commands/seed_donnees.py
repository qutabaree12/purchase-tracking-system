import datetime

from django.db import models
from django.core.management.base import BaseCommand

from authentication.models import Employe
from produits.models import Categorie, Fournisseur, Produit
from demandes.models import DemandeAchat, LigneDemandeAchat

# (nom_fournisseur, adresse_fournisseur, tel_fournisseur)
FOURNISSEURS = [
    ('HP Algérie', 'Zone industrielle Alger', 21321234567),
    ('Bureau Plus', 'Rue des Frères Boudiaf, Alger', 21321567890),
    ('Green Supply', 'Haï El Badr, Alger', 21321222233),
    ('Paper & Co', 'Chéraga, Alger', 21321444556),
]

CATEGORIES = [
    'Bureautique',
    'Mobilier',
    'Plantes',
    'Papeterie',
]

# (nom, categorie, prix_unit)
PRODUITS = [
    ('PC Portable', 'Bureautique', 150000),
    ('Clavier', 'Bureautique', 5000),
    ('Souris', 'Bureautique', 2500),
    ('Bureau', 'Mobilier', 80000),
    ('Chaise', 'Mobilier', 25000),
    ('Plante verte', 'Plantes', 3000),
    ('Stylo', 'Papeterie', 500),
    ('Cahier', 'Papeterie', 1200),
]

# Demandes acceptées : (numero_da, objet, [(nom_produit, qte), ...])
DEMANDES = [
    ('DA-ALG-2026-001', 'Renouvellement matériel réseau', [
        ('PC Portable', 5),
        ('Bureau', 3),
        ('Plante verte', 7),
    ]),
    ('DA-ALG-2026-002', 'Connecteurs et fournitures', [
        ('PC Portable', 10),
        ('Chaise', 8),
        ('Stylo', 4),
        ('Cahier', 9),
    ]),
    ('DA-ALG-2026-003', 'Équipement bureautique', [
        ('PC Portable', 6),
        ('Cahier', 1),
        ('Clavier', 3),
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

        # Catégories
        categories = {}
        for nom in CATEGORIES:
            c, _ = Categorie.objects.get_or_create(nom_categorie=nom)
            categories[nom] = c

        # Produits (num_produit n'est pas auto-incrémenté dans la table → fourni manuellement)
        produits = {}
        next_num = (Produit.objects.aggregate(m=models.Max('num_produit'))['m'] or 0) + 1
        for nom, cat, prix in PRODUITS:
            p = Produit.objects.filter(nom_produit=nom).first()
            if not p:
                p = Produit.objects.create(
                    num_produit=next_num,
                    nom_produit=nom,
                    prix_unit=prix,
                    id_categorie=categories[cat],
                )
                next_num += 1
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
            f'OK : {Fournisseur.objects.count()} fournisseurs, {Categorie.objects.count()} catégories, '
            f'{Produit.objects.count()} produits, {DemandeAchat.objects.count()} demandes.'
        ))
