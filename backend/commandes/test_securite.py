import datetime

from django.test import TestCase
from rest_framework.test import APIClient

from authentication.models import Employe
from commandes.models import BonDeCommande, DossierImportation, LigneBonDeCommande
from demandes.models import DemandeAchat, LigneDemandeAchat
from produits.models import Fournisseur, Produit

AUJOURDHUI = datetime.date.today()


def creer_employe(prenom, role):
    return Employe.objects.create(
        nom_emp='Test',
        prenom_emp=prenom,
        email_emp=f'{prenom.lower()}@test.dz',
        mot_de_passe='x',
        role=role,
    )


class BaseTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.acheteur = creer_employe('Acheteur', Employe.Role.ACHETEUR)
        self.acheteur2 = creer_employe('Acheteurdeux', Employe.Role.ACHETEUR)
        self.transitaire = creer_employe('Transitaire', Employe.Role.TRANSITAIRE)
        self.transitaire2 = creer_employe('Transitairedeux', Employe.Role.TRANSITAIRE)
        self.demandeur = creer_employe('Demandeur', Employe.Role.DEMANDEUR)

        self.fournisseur = Fournisseur.objects.create(nom_fournisseur='Fournisseur A')
        self.fournisseur_b = Fournisseur.objects.create(nom_fournisseur='Fournisseur B')
        self.produit = Produit.objects.create(
            nom_produit='Routeur', prix_unit=100, id_fournisseur=self.fournisseur
        )

    def se_connecter(self, employe):
        self.client.force_authenticate(user=employe)

    def creer_da_approuvee(self):
        da = DemandeAchat.objects.create(
            numero_da=f'DA-TEST-{DemandeAchat.objects.count() + 1:04d}',
            id_demandeur=self.demandeur,
            id_acheteur=self.acheteur,
            date_creation=AUJOURDHUI,
            objet='Besoin',
            statut=DemandeAchat.Statut.APPROUVEE,
        )
        LigneDemandeAchat.objects.create(
            id_da=da, id_produit=self.produit, designation='Routeur', qte=3, prix_unit=100
        )
        return da

    def creer_bc(self, da=None, fournisseur=None):
        bc = BonDeCommande.objects.create(
            id_da=da,
            id_acheteur=self.acheteur,
            id_fournisseur=fournisseur or self.fournisseur,
            date_creation=AUJOURDHUI,
            montant=200,
        )
        DossierImportation.objects.create(id_bc=bc)
        return bc


class PermissionsCommandesTest(BaseTest):
    def test_demandeur_ne_peut_ni_generer_ni_regrouper(self):
        self.se_connecter(self.demandeur)
        r = self.client.post('/api/bons-commande/generer/', {'paniers': []}, format='json')
        self.assertEqual(r.status_code, 403)
        r = self.client.post('/api/regroupement/', {'ids_da': [1]}, format='json')
        self.assertEqual(r.status_code, 403)

    def test_bc_en_lecture_seule(self):
        bc = self.creer_bc()
        self.se_connecter(self.acheteur)
        url = f'/api/bons-commande/{bc.id_bc}/'
        self.assertEqual(self.client.patch(url, {'montant': 1}, format='json').status_code, 405)
        self.assertEqual(self.client.delete(url).status_code, 405)
        self.assertEqual(
            self.client.post('/api/bons-commande/', {'montant': 1}, format='json').status_code, 405
        )
        bc.refresh_from_db()
        self.assertEqual(bc.montant, 200)

    def test_demandeur_ne_voit_que_les_bc_de_ses_da(self):
        da = self.creer_da_approuvee()
        bc_visible = self.creer_bc(da=da)
        self.creer_bc(da=None, fournisseur=self.fournisseur_b)
        self.se_connecter(self.demandeur)
        r = self.client.get('/api/bons-commande/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual([b['id_bc'] for b in r.data], [bc_visible.id_bc])


class GenerationBonsCommandeTest(BaseTest):
    def panier(self, fournisseur, produit, quantite=3):
        return {
            'fournisseur_id': fournisseur.pk,
            'produits': [{'produit_id': produit.pk, 'quantite': quantite, 'prix_unitaire': 1}],
        }

    def test_generation_complete_et_montant_calcule_cote_serveur(self):
        da = self.creer_da_approuvee()
        self.se_connecter(self.acheteur)
        r = self.client.post(
            '/api/bons-commande/generer/',
            {'paniers': [self.panier(self.fournisseur, self.produit)]},
            format='json',
        )
        self.assertEqual(r.status_code, 201, r.data)
        self.assertEqual(BonDeCommande.objects.count(), 1)
        self.assertEqual(DossierImportation.objects.count(), 1)
        self.assertEqual(LigneBonDeCommande.objects.count(), 1)
        bc = BonDeCommande.objects.get()
        self.assertEqual(bc.montant, 300)  # 100 x 3 : le prix client (1) est ignoré
        self.assertEqual(bc.id_da_id, da.pk)

    def test_generation_atomique_en_cas_de_panier_invalide(self):
        self.creer_da_approuvee()
        self.se_connecter(self.acheteur)
        # 2e panier invalide : le produit n'appartient pas au fournisseur B
        r = self.client.post(
            '/api/bons-commande/generer/',
            {'paniers': [
                self.panier(self.fournisseur, self.produit),
                self.panier(self.fournisseur_b, self.produit),
            ]},
            format='json',
        )
        self.assertEqual(r.status_code, 400)
        self.assertEqual(BonDeCommande.objects.count(), 0)
        self.assertEqual(DossierImportation.objects.count(), 0)
        self.assertEqual(LigneBonDeCommande.objects.count(), 0)

    def test_un_seul_bc_par_fournisseur_et_par_jour(self):
        self.creer_da_approuvee()
        self.creer_bc()
        self.se_connecter(self.acheteur)
        r = self.client.post(
            '/api/bons-commande/generer/',
            {'paniers': [self.panier(self.fournisseur, self.produit)]},
            format='json',
        )
        self.assertEqual(r.status_code, 400)
        self.assertEqual(BonDeCommande.objects.count(), 1)


class DossierImportationTest(BaseTest):
    def setUp(self):
        super().setUp()
        self.bc = self.creer_bc()
        self.dossier = self.bc.dossier_importation
        self.dossier.id_transitaire = self.transitaire
        self.dossier.statut = DossierImportation.Statut.EN_COURS
        self.dossier.save()
        self.url = f'/api/dossiers-importation/{self.dossier.pk}/'

    def test_statut_non_modifiable_par_patch(self):
        self.se_connecter(self.transitaire)
        r = self.client.patch(
            self.url, {'statut': 'livré', 'mode_expedition': 'maritime'}, format='json'
        )
        self.assertEqual(r.status_code, 200, r.data)
        self.dossier.refresh_from_db()
        self.assertEqual(self.dossier.statut, DossierImportation.Statut.EN_COURS)
        self.assertEqual(self.dossier.mode_expedition, 'maritime')

    def test_pas_de_creation_ni_de_suppression(self):
        self.se_connecter(self.acheteur)
        self.assertEqual(self.client.delete(self.url).status_code, 405)
        self.assertEqual(
            self.client.post('/api/dossiers-importation/', {}, format='json').status_code, 405
        )
        self.assertEqual(DossierImportation.objects.count(), 1)

    def test_reception_validee_puis_double_validation_refusee(self):
        self.se_connecter(self.transitaire)
        r = self.client.post(self.url + 'valider_reception/')
        self.assertEqual(r.status_code, 200, r.data)
        self.dossier.refresh_from_db()
        self.assertEqual(self.dossier.statut, DossierImportation.Statut.LIVRE)
        self.assertIsNotNone(self.dossier.date_reception_reelle)
        r = self.client.post(self.url + 'valider_reception/')
        self.assertEqual(r.status_code, 400)

    def test_reception_bloquee_si_autorisation_manquante(self):
        self.dossier.autorisation_necessaire = True
        self.dossier.autorisation_obtenue = False
        self.dossier.save()
        self.se_connecter(self.transitaire)
        r = self.client.post(self.url + 'valider_reception/')
        self.assertEqual(r.status_code, 400)
        self.dossier.refresh_from_db()
        self.assertEqual(self.dossier.statut, DossierImportation.Statut.EN_COURS)

    def test_autre_transitaire_ne_peut_pas_valider(self):
        self.se_connecter(self.transitaire2)
        r = self.client.post(self.url + 'valider_reception/')
        self.assertIn(r.status_code, (403, 404))
        self.dossier.refresh_from_db()
        self.assertEqual(self.dossier.statut, DossierImportation.Statut.EN_COURS)

    def test_autre_acheteur_ne_peut_pas_assigner(self):
        self.se_connecter(self.acheteur2)
        r = self.client.post(
            self.url + 'assigner_transitaire/',
            {'transitaire_id': self.transitaire2.pk},
            format='json',
        )
        self.assertIn(r.status_code, (403, 404))
        self.dossier.refresh_from_db()
        self.assertEqual(self.dossier.id_transitaire_id, self.transitaire.pk)

    def test_dossier_livre_non_modifiable(self):
        self.dossier.statut = DossierImportation.Statut.LIVRE
        self.dossier.save()
        self.se_connecter(self.transitaire)
        r = self.client.patch(self.url, {'mode_expedition': 'aerien'}, format='json')
        self.assertEqual(r.status_code, 400)
