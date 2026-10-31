import datetime

from authentication.models import Employe
from commandes.models import DossierImportation
from commandes.test_securite import BaseTest, creer_employe
from notifications.models import Notification

Controle = DossierImportation.StatutControle


class AffectationControleurTest(BaseTest):
    def setUp(self):
        super().setUp()
        self.c1 = creer_employe('Controleuruno', Employe.Role.CONTROLEUR)
        self.c2 = creer_employe('Controleurdeux', Employe.Role.CONTROLEUR)
        self.bc = self.creer_bc()
        self.dossier = self.bc.dossier_importation
        self.dossier.id_transitaire = self.transitaire
        self.dossier.statut = DossierImportation.Statut.EN_COURS
        self.dossier.mode_expedition = 'maritime'
        self.dossier.lieu_chargement = 'Marseille'
        self.dossier.date_livraison_prevue = datetime.date.today() + datetime.timedelta(days=20)
        self.dossier.save()
        self.url = f'/api/dossiers-importation/{self.dossier.pk}/'

    def post(self, user, action, data=None):
        self.se_connecter(user)
        return self.client.post(self.url + action + '/', data or {}, format='json')

    def payload_valide(self, numero='LC-100'):
        return {'decision': 'valide', 'numero_lc': numero, 'banque_lc': 'BNA',
                'date_lc': datetime.date.today().isoformat()}

    def ids_visibles(self, user):
        self.se_connecter(user)
        return [d['id_dossier'] for d in self.client.get('/api/dossiers-importation/').data]

    def test_prise_en_charge_reserve_le_dossier(self):
        r = self.post(self.c1, 'prendre_en_charge')
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual(r.data['id_controleur'], self.c1.pk)
        self.assertEqual(r.data['controleur_nom'], self.c1.full_name)
        self.assertIn(self.dossier.pk, self.ids_visibles(self.c1))
        self.assertNotIn(self.dossier.pk, self.ids_visibles(self.c2))

    def test_seconde_prise_en_charge_par_un_autre_refusee(self):
        self.post(self.c1, 'prendre_en_charge')
        r = self.post(self.c2, 'prendre_en_charge')
        self.assertIn(r.status_code, (400, 404))
        self.dossier.refresh_from_db()
        self.assertEqual(self.dossier.id_controleur_id, self.c1.pk)

    def test_prise_en_charge_reservee_aux_controleurs(self):
        for user in (self.transitaire, self.acheteur, self.demandeur):
            r = self.post(user, 'prendre_en_charge')
            self.assertIn(r.status_code, (403, 404), user.role)
        self.dossier.refresh_from_db()
        self.assertIsNone(self.dossier.id_controleur)

    def test_autre_controleur_ne_peut_pas_decider(self):
        self.post(self.c1, 'prendre_en_charge')
        r = self.post(self.c2, 'verifier_controleur', self.payload_valide())
        self.assertIn(r.status_code, (400, 404))
        self.dossier.refresh_from_db()
        self.assertEqual(self.dossier.statut_controle, Controle.A_VERIFIER)

    def test_decision_sans_prise_en_charge_reserve_automatiquement(self):
        r = self.post(self.c2, 'verifier_controleur', self.payload_valide())
        self.assertEqual(r.status_code, 200, r.data)
        self.dossier.refresh_from_db()
        self.assertEqual(self.dossier.id_controleur_id, self.c2.pk)
        # Décidé : visible par les deux contrôleurs (historique, page des lettres de crédit)
        self.assertIn(self.dossier.pk, self.ids_visibles(self.c1))

    def test_liberer_remet_dans_le_reservoir_commun(self):
        self.post(self.c1, 'prendre_en_charge')
        r = self.post(self.c2, 'liberer')
        self.assertIn(r.status_code, (400, 404))          # pas le détenteur
        r = self.post(self.c1, 'liberer')
        self.assertEqual(r.status_code, 200, r.data)
        self.assertIsNone(r.data['id_controleur'])
        self.assertIn(self.dossier.pk, self.ids_visibles(self.c2))

    def test_prise_en_charge_marque_les_notifications_des_autres_comme_lues(self):
        from notifications.utils import notifier_dossier_a_verifier
        notifier_dossier_a_verifier(self.dossier)      # les deux contrôleurs sont prévenus
        self.assertEqual(Notification.objects.filter(lu=False).count(), 2)
        self.post(self.c1, 'prendre_en_charge')
        self.assertFalse(Notification.objects.get(destinataire=self.c1).lu)
        self.assertTrue(Notification.objects.get(destinataire=self.c2).lu)

    def test_numero_de_lettre_de_credit_unique(self):
        self.assertEqual(self.post(self.c1, 'verifier_controleur', self.payload_valide('LC-777')).status_code, 200)
        bc2 = self.creer_bc(fournisseur=self.fournisseur_b)
        d2 = bc2.dossier_importation
        d2.id_transitaire = self.transitaire
        d2.statut = DossierImportation.Statut.EN_COURS
        d2.mode_expedition, d2.lieu_chargement = 'aerien', 'Paris'
        d2.date_livraison_prevue = datetime.date.today() + datetime.timedelta(days=5)
        d2.save()
        self.se_connecter(self.c1)
        url2 = f'/api/dossiers-importation/{d2.pk}/verifier_controleur/'
        r = self.client.post(url2, self.payload_valide('lc-777'), format='json')   # casse différente
        self.assertEqual(r.status_code, 400)
        self.assertIn('déjà utilisé', r.data['detail'])
        r = self.client.post(url2, self.payload_valide('LC-778'), format='json')
        self.assertEqual(r.status_code, 200, r.data)

    def test_refus_corrige_retourne_dans_le_reservoir(self):
        self.post(self.c1, 'prendre_en_charge')
        r = self.post(self.c1, 'verifier_controleur', {'decision': 'refuse', 'commentaire': 'Pièce manquante'})
        self.assertEqual(r.status_code, 200, r.data)
        self.se_connecter(self.transitaire)
        r = self.client.patch(self.url, {'lieu_chargement': 'Valence'}, format='json')
        self.assertEqual(r.status_code, 200, r.data)
        self.dossier.refresh_from_db()
        self.assertEqual(self.dossier.statut_controle, Controle.A_VERIFIER)
        self.assertIsNone(self.dossier.id_controleur)
        self.assertIn(self.dossier.pk, self.ids_visibles(self.c2))

    def test_champ_id_controleur_non_modifiable_par_patch(self):
        self.se_connecter(self.transitaire)
        r = self.client.patch(self.url, {'id_controleur': self.c1.pk, 'lieu_chargement': 'Alger'}, format='json')
        self.assertEqual(r.status_code, 200, r.data)
        self.dossier.refresh_from_db()
        self.assertIsNone(self.dossier.id_controleur)
