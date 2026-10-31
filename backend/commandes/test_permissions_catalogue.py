from authentication.models import Employe
from commandes.test_securite import BaseTest, creer_employe


class CataloguePermissionsTest(BaseTest):
    def setUp(self):
        super().setUp()
        self.admin = creer_employe('Admin', Employe.Role.ADMIN)

    def test_lecture_ouverte_aux_utilisateurs_connectes(self):
        for user in (self.demandeur, self.acheteur, self.transitaire):
            self.se_connecter(user)
            self.assertEqual(self.client.get('/api/produits/').status_code, 200)
            self.assertEqual(self.client.get('/api/fournisseurs/').status_code, 200)

    def test_ecriture_refusee_aux_non_admin(self):
        for user in (self.demandeur, self.acheteur, self.transitaire):
            self.se_connecter(user)
            r = self.client.patch(f'/api/produits/{self.produit.pk}/', {'prix_unit': 1}, format='json')
            self.assertEqual(r.status_code, 403, user.role)
            r = self.client.patch(
                f'/api/fournisseurs/{self.fournisseur.pk}/', {'nom_fournisseur': 'Pirate'}, format='json'
            )
            self.assertEqual(r.status_code, 403, user.role)
            self.assertEqual(self.client.delete(f'/api/produits/{self.produit.pk}/').status_code, 403)
        self.produit.refresh_from_db()
        self.fournisseur.refresh_from_db()
        self.assertEqual(self.fournisseur.nom_fournisseur, 'Fournisseur A')

    def test_admin_peut_modifier(self):
        self.se_connecter(self.admin)
        r = self.client.patch(f'/api/produits/{self.produit.pk}/', {'prix_unit': 120}, format='json')
        self.assertEqual(r.status_code, 200, r.data)
        r = self.client.patch(
            f'/api/fournisseurs/{self.fournisseur.pk}/', {'nom_fournisseur': 'Renommé'}, format='json'
        )
        self.assertEqual(r.status_code, 200, r.data)

    def test_anonyme_refuse(self):
        self.client.force_authenticate(user=None)
        self.assertIn(self.client.get('/api/produits/').status_code, (401, 403))
