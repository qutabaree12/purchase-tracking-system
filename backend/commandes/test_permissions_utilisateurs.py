from authentication.models import Employe
from commandes.test_securite import BaseTest, creer_employe


class ListeEmployesTest(BaseTest):
    def setUp(self):
        super().setUp()
        self.admin = creer_employe('Admin', Employe.Role.ADMIN)
        self.chef = creer_employe('Chef', Employe.Role.CHEF_DEPARTEMENT)
        self.controleur = creer_employe('Controleur', Employe.Role.CONTROLEUR)

    def roles_vus(self, user):
        self.se_connecter(user)
        r = self.client.get('/api/users/')
        self.assertEqual(r.status_code, 200, r.data)
        return {e['role'] for e in r.data}

    def test_roles_sans_besoin_refuses(self):
        for user in (self.demandeur, self.transitaire, self.controleur):
            self.se_connecter(user)
            self.assertEqual(self.client.get('/api/users/').status_code, 403, user.role)

    def test_acheteur_ne_voit_que_les_transitaires(self):
        self.assertEqual(self.roles_vus(self.acheteur), {Employe.Role.TRANSITAIRE})

    def test_chef_ne_voit_que_les_acheteurs(self):
        self.assertEqual(self.roles_vus(self.chef), {Employe.Role.ACHETEUR})

    def test_admin_voit_tout_le_monde(self):
        self.assertGreater(len(self.roles_vus(self.admin)), 3)

    def test_ecriture_refusee_aux_non_admin(self):
        for user in (self.acheteur, self.chef, self.demandeur):
            self.se_connecter(user)
            r = self.client.patch(f'/api/users/{self.transitaire.pk}/', {'role': 'admin'}, format='json')
            self.assertIn(r.status_code, (403, 404, 405), user.role)
        self.transitaire.refresh_from_db()
        self.assertEqual(self.transitaire.role, Employe.Role.TRANSITAIRE)
