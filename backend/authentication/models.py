from django.db import models
from django.contrib.auth.hashers import (
    make_password as hash_password,
    check_password as verify_password,
)


class Employe(models.Model):
    """Employé Algérie Telecom (table Supabase `Employé`)."""

    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        DEMANDEUR = 'demandeur', 'Demandeur'
        CHEF_DEPARTEMENT = 'chef département', 'Chef de département'
        ACHETEUR = 'acheteur', 'Acheteur'
        TRANSITAIRE = 'transitaire', 'Transitaire'
        DIRECTEUR = 'directeur', 'Directeur'

    class Etat(models.TextChoices):
        ACTIF = 'actif', 'Actif'
        ARCHIVE = 'archivé', 'Archivé'

    id_emp = models.BigAutoField(primary_key=True)
    nom_emp = models.CharField(max_length=100)
    prenom_emp = models.CharField(max_length=100, db_column='prénom_emp')
    email_emp = models.EmailField(max_length=255)
    mot_de_passe = models.CharField(max_length=255)
    role = models.CharField(max_length=30, choices=Role.choices, default=Role.DEMANDEUR)
    etat = models.CharField(max_length=10, choices=Etat.choices, default=Etat.ACTIF)

    class Meta:
        db_table = 'Employé'
        verbose_name = 'Employé'
        verbose_name_plural = 'Employés'
        managed = True

    def __str__(self):
        return self.full_name

    @property
    def full_name(self):
        return f"{self.prenom_emp} {self.nom_emp}"

    @property
    def email(self):
        return self.email_emp

    def set_password(self, raw_password):
        """Stocke le mot de passe de manière hachée (jamais en clair)."""
        self.mot_de_passe = hash_password(raw_password)

    def check_password(self, raw_password):
        """Vérifie un mot de passe saisi contre le hash stocké."""
        return verify_password(raw_password, self.mot_de_passe)

    # --- Interface requise par Django / DRF ---
    @property
    def is_authenticated(self):
        return True

    @property
    def is_active(self):
        return self.etat == self.Etat.ACTIF

    @property
    def is_staff(self):
        return self.role == self.Role.ADMIN

    @property
    def is_superuser(self):
        return self.role == self.Role.ADMIN
