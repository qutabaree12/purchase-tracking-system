import datetime

from django.test import TestCase
from rest_framework.test import APIClient

from authentication.models import Employe
from demandes.models import DemandeAchat
from produits.models import Fournisseur
from .models import BonDeCommande, DossierImportation


def extraire_ids(data):
    """
    Gère les deux formes possibles de réponse liste :
    - liste brute (OptionalPagination sans ?page=)
    - dict paginé {results: [...]}
    """
    items = data.get('results', data) if hasattr(data, 'get') else data
    return [d['id_dossier'] for d in items]


class DossierImportationPermissionsTestCase(TestCase):
    """
    Vérifie que seul le transitaire assigné peut voir/modifier son dossier,
    et que seul l'acheteur propriétaire du BC peut assigner/réassigner.
    """

    @classmethod
    def setUpTestData(cls):
        cls.acheteur = Employe.objects.create(
            nom_emp='Sebbah', prenom_emp='Mouloud',
            email_emp='acheteur@test.dz',
            role=Employe.Role.ACHETEUR, etat=Employe.Etat.ACTIF,
        )
        cls.acheteur.set_password('x')
        cls.acheteur.save()

        cls.autre_acheteur = Employe.objects.create(
            nom_emp='Autre', prenom_emp='Acheteur',
            email_emp='autre.acheteur@test.dz',
            role=Employe.Role.ACHETEUR, etat=Employe.Etat.ACTIF,
        )

        cls.transitaire = Employe.objects.create(
            nom_emp='Belaid', prenom_emp='Nour',
            email_emp='transitaire@test.dz',
            role=Employe.Role.TRANSITAIRE, etat=Employe.Etat.ACTIF,
        )

        cls.autre_transitaire = Employe.objects.create(
            nom_emp='Autre', prenom_emp='Transitaire',
            email_emp='autre.transitaire@test.dz',
            role=Employe.Role.TRANSITAIRE, etat=Employe.Etat.ACTIF,
        )

        cls.transitaire_archive = Employe.objects.create(
            nom_emp='Archive', prenom_emp='Transitaire',
            email_emp='archive@test.dz',
            role=Employe.Role.TRANSITAIRE, etat=Employe.Etat.ARCHIVE,
        )

        cls.demandeur = Employe.objects.create(
            nom_emp='Boukhelif', prenom_emp='Nadia',
            email_emp='demandeur@test.dz',
            role=Employe.Role.DEMANDEUR, etat=Employe.Etat.ACTIF,
        )

        cls.fournisseur = Fournisseur.objects.create(
            nom_fournisseur='HP Algérie',
            adresse_fournisseur='Alger',
            tel_fournisseur=213555000000,
        )

        cls.demande = DemandeAchat.objects.create(
            numero_da='DA-2026-TEST',
            id_demandeur=cls.demandeur,
            objet='Matériel de test',
            statut=DemandeAchat.Statut.APPROUVEE,
            date_creation=datetime.date.today(),
        )

        cls.bc = BonDeCommande.objects.create(
            id_da=cls.demande,
            id_acheteur=cls.acheteur,
            id_fournisseur=cls.fournisseur,
            date_creation=datetime.date.today(),
            montant=1000,
        )

        cls.dossier = DossierImportation.objects.create(
            id_bc=cls.bc,
            id_transitaire=cls.transitaire,
            statut=DossierImportation.Statut.EN_COURS,
        )

    def setUp(self):
        self.client = APIClient()

    # ---- get_queryset : visibilité ----

    def test_transitaire_assigne_voit_son_dossier(self):
        self.client.force_authenticate(user=self.transitaire)
        res = self.client.get('/api/dossiers-importation/')
        self.assertIn(self.dossier.id_dossier, extraire_ids(res.data))

    def test_transitaire_non_assigne_ne_voit_pas_le_dossier(self):
        self.client.force_authenticate(user=self.autre_transitaire)
        res = self.client.get('/api/dossiers-importation/')
        self.assertNotIn(self.dossier.id_dossier, extraire_ids(res.data))

    def test_acheteur_proprietaire_voit_le_dossier(self):
        self.client.force_authenticate(user=self.acheteur)
        res = self.client.get('/api/dossiers-importation/')
        self.assertIn(self.dossier.id_dossier, extraire_ids(res.data))

    def test_acheteur_non_proprietaire_ne_voit_pas_le_dossier(self):
        self.client.force_authenticate(user=self.autre_acheteur)
        res = self.client.get('/api/dossiers-importation/')
        self.assertNotIn(self.dossier.id_dossier, extraire_ids(res.data))

    # ---- update / partial_update ----
    # NB: get_object() applique get_queryset() AVANT le check de rôle explicite.
    # Un utilisateur hors du périmètre filtré reçoit donc 404 (l'objet est
    # invisible pour lui), pas 403. C'est plus strict, pas un bug.

    def test_transitaire_assigne_peut_modifier(self):
        self.client.force_authenticate(user=self.transitaire)
        res = self.client.patch(
            f'/api/dossiers-importation/{self.dossier.id_dossier}/',
            {'lieu_chargement': "Port d'Alger"},
            format='json',
        )
        self.assertEqual(res.status_code, 200)

    def test_transitaire_non_assigne_recoit_404(self):
        self.client.force_authenticate(user=self.autre_transitaire)
        res = self.client.patch(
            f'/api/dossiers-importation/{self.dossier.id_dossier}/',
            {'lieu_chargement': "Port d'Oran"},
            format='json',
        )
        self.assertEqual(res.status_code, 404)

    def test_acheteur_recoit_404_sur_modification(self):
        """L'acheteur n'a pas le dossier dans son queryset en écriture
        au sens filtré par update(); son propre get_queryset() le voit
        en lecture, mais le check de rôle explicite le bloque en 403
        puisque l'objet EST dans son queryset (il est propriétaire du BC)."""
        self.client.force_authenticate(user=self.acheteur)
        res = self.client.patch(
            f'/api/dossiers-importation/{self.dossier.id_dossier}/',
            {'lieu_chargement': "Port d'Alger"},
            format='json',
        )
        self.assertEqual(res.status_code, 403)

    def test_role_non_filtre_bloque_par_check_explicite(self):
        """Le demandeur passe par la branche sans filtre de get_queryset()
        (le trou identifié), donc get_object() le trouve. C'est le check
        de rôle explicite dans update() qui le bloque ensuite avec 403.
        Preuve que ce check n'est pas du code mort."""
        self.client.force_authenticate(user=self.demandeur)
        res = self.client.patch(
            f'/api/dossiers-importation/{self.dossier.id_dossier}/',
            {'lieu_chargement': 'Test'},
            format='json',
        )
        self.assertEqual(res.status_code, 403)

    # ---- assigner_transitaire ----

    def test_acheteur_proprietaire_peut_assigner(self):
        self.client.force_authenticate(user=self.acheteur)
        res = self.client.post(
            f'/api/dossiers-importation/{self.dossier.id_dossier}/assigner_transitaire/',
            {'transitaire_id': self.autre_transitaire.id_emp},
            format='json',
        )
        self.assertEqual(res.status_code, 200)
        self.dossier.refresh_from_db()
        self.assertEqual(self.dossier.id_transitaire_id, self.autre_transitaire.id_emp)

    def test_acheteur_non_proprietaire_recoit_404(self):
        self.client.force_authenticate(user=self.autre_acheteur)
        res = self.client.post(
            f'/api/dossiers-importation/{self.dossier.id_dossier}/assigner_transitaire/',
            {'transitaire_id': self.autre_transitaire.id_emp},
            format='json',
        )
        self.assertEqual(res.status_code, 404)

    def test_transitaire_ne_peut_pas_s_auto_assigner(self):
        self.client.force_authenticate(user=self.autre_transitaire)
        res = self.client.post(
            f'/api/dossiers-importation/{self.dossier.id_dossier}/assigner_transitaire/',
            {'transitaire_id': self.autre_transitaire.id_emp},
            format='json',
        )
        # Le transitaire ne voit pas ce dossier dans son propre queryset
        # (il n'y est pas assigné) → 404, pas 403.
        self.assertEqual(res.status_code, 404)

    def test_ne_peut_pas_assigner_un_transitaire_archive(self):
        self.client.force_authenticate(user=self.acheteur)
        res = self.client.post(
            f'/api/dossiers-importation/{self.dossier.id_dossier}/assigner_transitaire/',
            {'transitaire_id': self.transitaire_archive.id_emp},
            format='json',
        )
        self.assertEqual(res.status_code, 400)

    def test_ne_peut_pas_assigner_un_non_transitaire(self):
        self.client.force_authenticate(user=self.acheteur)
        res = self.client.post(
            f'/api/dossiers-importation/{self.dossier.id_dossier}/assigner_transitaire/',
            {'transitaire_id': self.demandeur.id_emp},
            format='json',
        )
        self.assertEqual(res.status_code, 400)

    def test_assigner_sans_transitaire_id_renvoie_400(self):
        self.client.force_authenticate(user=self.acheteur)
        res = self.client.post(
            f'/api/dossiers-importation/{self.dossier.id_dossier}/assigner_transitaire/',
            {},
            format='json',
        )
        self.assertEqual(res.status_code, 400)

    # ---- valider_reception ----

    def test_transitaire_assigne_peut_valider_reception(self):
        self.client.force_authenticate(user=self.transitaire)
        res = self.client.post(
            f'/api/dossiers-importation/{self.dossier.id_dossier}/valider_reception/'
        )
        self.assertEqual(res.status_code, 200)
        self.dossier.refresh_from_db()
        self.assertEqual(self.dossier.statut, DossierImportation.Statut.LIVRE)
        self.assertIsNotNone(self.dossier.date_reception_reelle)

    def test_transitaire_non_assigne_recoit_404_sur_reception(self):
        self.client.force_authenticate(user=self.autre_transitaire)
        res = self.client.post(
            f'/api/dossiers-importation/{self.dossier.id_dossier}/valider_reception/'
        )
        self.assertEqual(res.status_code, 404)

    def test_acheteur_recoit_403_sur_reception(self):
        """L'acheteur voit le dossier (il est propriétaire du BC),
        donc get_object() réussit ; c'est le check de rôle qui bloque."""
        self.client.force_authenticate(user=self.acheteur)
        res = self.client.post(
            f'/api/dossiers-importation/{self.dossier.id_dossier}/valider_reception/'
        )
        self.assertEqual(res.status_code, 403)

    def test_anonyme_recoit_401(self):
        res = self.client.get('/api/dossiers-importation/')
        self.assertEqual(res.status_code, 401)

    # ---- Trou identifié : rôles hors transitaire/acheteur voient tout en lecture ----

    def test_demandeur_voit_tous_les_dossiers_en_lecture(self):
        """
        Documente le comportement ACTUEL (pas forcément voulu) :
        un rôle qui n'est ni transitaire ni acheteur passe à travers
        get_queryset() sans filtre (if/elif sans else). En écriture,
        le check de rôle explicite bloque (voir test ci-dessus) — mais
        en LECTURE, rien ne l'empêche de tout voir. À trancher avec
        l'équipe : est-ce voulu pour l'admin uniquement, ou un oubli ?
        """
        self.client.force_authenticate(user=self.demandeur)
        res = self.client.get('/api/dossiers-importation/')
        self.assertIn(self.dossier.id_dossier, extraire_ids(res.data))