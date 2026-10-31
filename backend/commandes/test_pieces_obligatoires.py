import datetime
import shutil
import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings

from authentication.models import Employe
from commandes.models import DossierImportation
from commandes.test_securite import BaseTest, creer_employe
from notifications.models import Notification

TMP = tempfile.mkdtemp()
URL = '/api/documents-dossier/'
OBLIGATOIRES = ['facture', 'colisage', 'origine', 'transport']
Statut = DossierImportation.Statut
Controle = DossierImportation.StatutControle


def pdf(nom='piece.pdf'):
    return SimpleUploadedFile(nom, b'%PDF-1.4 test', content_type='application/pdf')


@override_settings(MEDIA_ROOT=TMP, EXIGER_PIECES_OBLIGATOIRES=True)
class PiecesObligatoiresTest(BaseTest):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TMP, ignore_errors=True)

    def setUp(self):
        super().setUp()
        self.controleur = creer_employe('Controleur', Employe.Role.CONTROLEUR)
        self.bc = self.creer_bc()
        self.dossier = self.bc.dossier_importation
        self.dossier.id_transitaire = self.transitaire
        self.dossier.statut = Statut.EN_COURS
        self.dossier.mode_expedition = 'maritime'
        self.dossier.lieu_chargement = 'Marseille'
        self.dossier.date_livraison_prevue = datetime.date.today() + datetime.timedelta(days=30)
        self.dossier.save()
        self.url = f'/api/dossiers-importation/{self.dossier.pk}/'

    def deposer(self, type_doc):
        self.se_connecter(self.transitaire)
        r = self.client.post(
            URL,
            {'dossier': self.dossier.pk, 'type': type_doc, 'fichier': pdf()},
            format='multipart',
        )
        self.assertEqual(r.status_code, 201, r.data)

    def ids_vus_par_le_controleur(self):
        self.se_connecter(self.controleur)
        return [d['id_dossier'] for d in self.client.get('/api/dossiers-importation/').data]

    def test_sans_pieces_le_dossier_n_est_pas_pret(self):
        self.se_connecter(self.transitaire)
        r = self.client.get(self.url)
        self.assertFalse(r.data['pret_pour_controle'])
        self.assertEqual(sorted(r.data['documents_manquants']), sorted(OBLIGATOIRES))

    def test_dossier_sans_pieces_invisible_pour_le_controleur(self):
        self.assertNotIn(self.dossier.pk, self.ids_vus_par_le_controleur())
        self.se_connecter(self.controleur)
        r = self.client.post(
            self.url + 'verifier_controleur/',
            {'decision': 'refuse', 'commentaire': 'test'}, format='json',
        )
        self.assertIn(r.status_code, (400, 404))
        self.dossier.refresh_from_db()
        self.assertEqual(self.dossier.statut_controle, Controle.A_VERIFIER)

    def test_assurance_et_autre_ne_comptent_pas(self):
        self.deposer('assurance')
        self.deposer('autre')
        self.se_connecter(self.transitaire)
        r = self.client.get(self.url)
        self.assertEqual(len(r.data['documents_manquants']), 4)

    def test_derniere_piece_rend_le_dossier_visible_et_notifie_une_fois(self):
        for type_doc in OBLIGATOIRES[:3]:
            self.deposer(type_doc)
        self.assertEqual(Notification.objects.filter(destinataire=self.controleur).count(), 0)
        self.assertNotIn(self.dossier.pk, self.ids_vus_par_le_controleur())

        self.deposer(OBLIGATOIRES[3])
        self.assertEqual(Notification.objects.filter(destinataire=self.controleur).count(), 1)
        self.assertIn(self.dossier.pk, self.ids_vus_par_le_controleur())

        # une pièce de plus ne renotifie pas
        self.deposer('autre')
        self.assertEqual(Notification.objects.filter(destinataire=self.controleur).count(), 1)

    def test_validation_possible_avec_toutes_les_pieces(self):
        for type_doc in OBLIGATOIRES:
            self.deposer(type_doc)
        self.se_connecter(self.controleur)
        r = self.client.post(
            self.url + 'verifier_controleur/',
            {
                'decision': 'valide', 'numero_lc': 'LC-PIECES-1', 'banque_lc': 'BNA',
                'date_lc': datetime.date.today().isoformat(), 'commentaire': '',
            },
            format='json',
        )
        self.assertEqual(r.status_code, 200, r.data)

    def test_dossier_deja_decide_reste_visible_sans_pieces(self):
        self.dossier.statut_controle = Controle.VALIDE
        self.dossier.save()
        self.assertIn(self.dossier.pk, self.ids_vus_par_le_controleur())
