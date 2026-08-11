from django.core.management.base import BaseCommand

from authentication.models import Employe

EMPLOYES = [
    # (nom, prenom, email, mot_de_passe, role)
    ('Benali', 'Ahmed', 'ahmed.benali@algerietelecom.dz', 'pass123', 'admin'),
    ('Ouali', 'Fatima', 'fatima.ouali@algerietelecom.dz', 'pass123', 'admin'),
    ('Kadi', 'Sofiane', 'sofiane.kadi@algerietelecom.dz', 'pass123', 'demandeur'),
    ('Boukhelif', 'Nadia', 'nadia.boukhelif@algerietelecom.dz', 'pass123', 'demandeur'),
    ('Cherif', 'Mohamed', 'mohamed.cherif@algerietelecom.dz', 'pass123', 'demandeur'),
    ('Toumi', 'Rachid', 'rachid.toumi@algerietelecom.dz', 'pass123', 'chef département'),
    ('Slimani', 'Zahia', 'zahia.slimani@algerietelecom.dz', 'pass123', 'chef département'),
    ('Mokhtari', 'Ali', 'ali.mokhtari@algerietelecom.dz', 'pass123', 'acheteur'),
    ('Ziani', 'Yamina', 'yamina.ziani@algerietelecom.dz', 'pass123', 'acheteur'),
    ('Hadjadj', 'Lynda', 'lynda.hadjadj@algerietelecom.dz', 'pass123', 'acheteur'),
    ('Belaid', 'Nour', 'nour.belaid@algerietelecom.dz', 'pass123', 'transitaire'),
    ('Said', 'Hocine', 'hocine.said@algerietelecom.dz', 'pass123', 'transitaire'),
    ('Guenoun', 'Tahar', 'tahar.guenoun@algerietelecom.dz', 'pass123', 'directeur'),
]


class Command(BaseCommand):
    help = 'Insère les employés de démonstration (Algérie Telecom).'

    def handle(self, *args, **options):
        for nom, prenom, email, mdp, role in EMPLOYES:
            Employe.objects.update_or_create(
                email_emp=email,
                defaults={
                    'nom_emp': nom,
                    'prenom_emp': prenom,
                    'mot_de_passe': mdp,
                    'role': role,
                    'etat': 'actif',
                },
            )
        self.stdout.write(self.style.SUCCESS(f'{len(EMPLOYES)} employés insérés.'))
