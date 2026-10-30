import datetime

from authentication.models import Employe
from commandes.models import DossierImportation
from commandes.test_securite import BaseTest, creer_employe
from notifications.models import Notification

Controle = DossierImportation.StatutControle
Statut = DossierImportation.Statut


class ControleDossierTest(BaseTest):
    def setUp(self):
        super().setUp()
        self.controleur = creer_employe('Controleur', Employe.Role.CONTROLEUR)
        self.controleur2 = creer_employe('Controleurdeux', Employe.Role.CONTROLEUR)
        self.bc = self.creer_bc()
        self.dossier = self.bc.dossier_importation
        self.dossier.id_transitaire = self.transitaire
        self.dossier.statut = Statut.EN_COURS
        self.dossier.mode_expedition = 'maritime'
        self.dossier.lieu_chargement = 'Marseille'
        self.dossier.date_livraison_prevue = datetime.date.today() + datetime.timedelta(days=30)
        self.dossier.save()
        self.url = f'/api/dossiers-importation/{self.dossier.pk}/'

    def valider_payload(self, **extra):
        data = {
            'decision': 'valide',
            'numero_lc': 'LC-2026-001',
            'banque_lc': 'BNA',
            'date_lc': datetime.date.today().isoformat(),
            'commentaire': '',
        }
        data.update(extra)
        return data

    def verifier(self, user, payload):
        self.se_connecter(user)
        return self.client.post(self.url + 'verifier_controleur/', payload, format='json')

    # -- visibilité -------------------------------------------------------
    def test_controleur_ne_voit_pas_un_dossier_non_assigne_ou_incomplet(self):
        autre_bc = self.creer_bc(fournisseur=self.fournisseur_b)  # dossier sans transitaire
        incomplet_bc = self.creer_bc(da=None, fournisseur=self.fournisseur_b.__class__.objects.create(nom_fournisseur='C'))
        d = incomplet_bc.dossier_importation
        d.id_transitaire = self.transitaire
        d.statut = Statut.EN_COURS
        d.save()  # assigné mais mode/lieu/date vides
        self.se_connecter(self.controleur)
        r = self.client.get('/api/dossiers-importation/')
        ids = [x['id_dossier'] for x in r.data]
        self.assertEqual(ids, [self.dossier.pk])
        self.assertNotIn(autre_bc.dossier_importation.pk, ids)
        self.assertNotIn(d.pk, ids)

    # -- décisions --------------------------------------------------------
    def test_non_controleur_ne_peut_pas_verifier(self):
        for user in (self.transitaire, self.acheteur, self.demandeur):
            r = self.verifier(user, self.valider_payload())
            self.assertIn(r.status_code, (403, 404), user.role)
        self.dossier.refresh_from_db()
        self.assertEqual(self.dossier.statut_controle, Controle.A_VERIFIER)

    def test_refus_sans_commentaire_rejete(self):
        r = self.verifier(self.controleur, {'decision': 'refuse', 'commentaire': ''})
        self.assertEqual(r.status_code, 400)

    def test_validation_sans_lettre_de_credit_rejetee(self):
        r = self.verifier(self.controleur, self.valider_payload(numero_lc=''))
        self.assertEqual(r.status_code, 400)

    def test_date_lc_invalide_ou_future_rejetee(self):
        r = self.verifier(self.controleur, self.valider_payload(date_lc='pas-une-date'))
        self.assertEqual(r.status_code, 400)
        futur = (datetime.date.today() + datetime.timedelta(days=5)).isoformat()
        r = self.verifier(self.controleur, self.valider_payload(date_lc=futur))
        self.assertEqual(r.status_code, 400)
        self.dossier.refresh_from_db()
        self.assertEqual(self.dossier.statut_controle, Controle.A_VERIFIER)

    def test_validation_complete_et_notifications(self):
        r = self.verifier(self.controleur, self.valider_payload())
        self.assertEqual(r.status_code, 200, r.data)
        self.dossier.refresh_from_db()
        self.assertEqual(self.dossier.statut_controle, Controle.VALIDE)
        self.assertEqual(self.dossier.numero_lc, 'LC-2026-001')
        self.assertEqual(self.dossier.date_controle, datetime.date.today())
        destinataires = set(Notification.objects.values_list('destinataire', flat=True))
        self.assertIn(self.transitaire.pk, destinataires)
        self.assertIn(self.acheteur.pk, destinataires)

    def test_dossier_incomplet_ne_peut_pas_etre_verifie(self):
        self.dossier.lieu_chargement = ''
        self.dossier.save()
        r = self.verifier(self.controleur, self.valider_payload())
        # Le dossier incomplet est invisible pour le contrôleur (404) ou refusé (400).
        self.assertIn(r.status_code, (400, 404))
        self.dossier.refresh_from_db()
        self.assertEqual(self.dossier.statut_controle, Controle.A_VERIFIER)

    def test_dossier_non_assigne_ne_peut_pas_etre_verifie(self):
        bc = self.creer_bc(fournisseur=self.fournisseur_b)
        self.se_connecter(self.controleur)
        r = self.client.post(
            f'/api/dossiers-importation/{bc.dossier_importation.pk}/verifier_controleur/',
            self.valider_payload(), format='json',
        )
        self.assertIn(r.status_code, (400, 404))
        bc.dossier_importation.refresh_from_db()
        self.assertEqual(bc.dossier_importation.statut_controle, Controle.A_VERIFIER)

    def test_pas_de_seconde_decision(self):
        self.assertEqual(self.verifier(self.controleur, self.valider_payload()).status_code, 200)
        r = self.verifier(self.controleur2, {'decision': 'refuse', 'commentaire': 'finalement non'})
        self.assertEqual(r.status_code, 400)
        self.dossier.refresh_from_db()
        self.assertEqual(self.dossier.statut_controle, Controle.VALIDE)

    # -- cycle refus -> correction -> nouvelle vérification ----------------
    def test_refus_puis_correction_repasse_a_verifier_et_previent_le_controleur(self):
        r = self.verifier(self.controleur, {'decision': 'refuse', 'commentaire': 'Facture illisible'})
        self.assertEqual(r.status_code, 200, r.data)
        self.dossier.refresh_from_db()
        self.assertEqual(self.dossier.statut_controle, Controle.REFUSE)
        self.assertTrue(
            Notification.objects.filter(destinataire=self.transitaire, message__contains='Facture illisible').exists()
        )
        Notification.objects.all().delete()

        self.se_connecter(self.transitaire)
        r = self.client.patch(self.url, {'lieu_chargement': 'Barcelone'}, format='json')
        self.assertEqual(r.status_code, 200, r.data)
        self.dossier.refresh_from_db()
        self.assertEqual(self.dossier.statut_controle, Controle.A_VERIFIER)
        self.assertEqual(self.dossier.lieu_chargement, 'Barcelone')
        self.assertTrue(Notification.objects.filter(destinataire=self.controleur).exists())

        r = self.verifier(self.controleur, self.valider_payload())
        self.assertEqual(r.status_code, 200, r.data)

    def test_dossier_valide_verrouille_pour_le_transitaire(self):
        self.verifier(self.controleur, self.valider_payload())
        self.se_connecter(self.transitaire)
        r = self.client.patch(self.url, {'mode_expedition': 'aerien'}, format='json')
        self.assertEqual(r.status_code, 400)
        self.dossier.refresh_from_db()
        self.assertEqual(self.dossier.mode_expedition, 'maritime')

    def test_champs_de_controle_non_modifiables_par_patch(self):
        self.se_connecter(self.transitaire)
        r = self.client.patch(
            self.url,
            {'statut_controle': 'valide', 'numero_lc': 'FAUX', 'lieu_chargement': 'Alger'},
            format='json',
        )
        self.assertEqual(r.status_code, 200, r.data)
        self.dossier.refresh_from_db()
        self.assertEqual(self.dossier.statut_controle, Controle.A_VERIFIER)
        self.assertEqual(self.dossier.numero_lc, '')

    # -- réception --------------------------------------------------------
    def test_reception_impossible_avant_validation_puis_possible(self):
        self.se_connecter(self.transitaire)
        r = self.client.post(self.url + 'valider_reception/')
        self.assertEqual(r.status_code, 400)
        self.verifier(self.controleur, self.valider_payload())
        self.se_connecter(self.transitaire)
        r = self.client.post(self.url + 'valider_reception/')
        self.assertEqual(r.status_code, 200, r.data)
        self.dossier.refresh_from_db()
        self.assertEqual(self.dossier.statut, Statut.LIVRE)

    def test_reception_bloquee_si_autorisation_manquante_meme_apres_controle(self):
        self.dossier.autorisation_necessaire = True
        self.dossier.autorisation_obtenue = False
        self.dossier.save()
        self.verifier(self.controleur, self.valider_payload())
        self.se_connecter(self.transitaire)
        r = self.client.post(self.url + 'valider_reception/')
        self.assertEqual(r.status_code, 400)
        self.assertIn('autorisation', r.data['detail'].lower())

    # -- champs exposés ---------------------------------------------------
    def test_champs_da_reference_et_montant_exposes(self):
        da = self.creer_da_approuvee()
        self.bc.id_da = da
        self.bc.save()
        self.se_connecter(self.controleur)
        r = self.client.get(self.url)
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual(r.data['da_reference'], da.numero_da)
        self.assertEqual(r.data['montant'], 200)
        self.assertTrue(r.data['pret_pour_controle'])
        self.se_connecter(self.acheteur)
        r = self.client.get(f'/api/bons-commande/{self.bc.pk}/')
        self.assertEqual(r.data['da_reference'], da.numero_da)
