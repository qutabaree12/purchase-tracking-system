import datetime
import shutil
import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings

from authentication.models import Employe
from commandes.models import DocumentDossier, DossierImportation
from commandes.test_securite import BaseTest, creer_employe

TMP = tempfile.mkdtemp()
URL = '/api/documents-dossier/'


def pdf(nom='facture.pdf', contenu=b'%PDF-1.4 test'):
    return SimpleUploadedFile(nom, contenu, content_type='application/pdf')


@override_settings(MEDIA_ROOT=TMP)
class DocumentsDossierTest(BaseTest):
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
        self.dossier.statut = DossierImportation.Statut.EN_COURS
        self.dossier.mode_expedition = 'maritime'
        self.dossier.lieu_chargement = 'Marseille'
        self.dossier.date_livraison_prevue = datetime.date.today() + datetime.timedelta(days=30)
        self.dossier.save()

    def deposer(self, user, fichier=None, type_doc='facture'):
        self.se_connecter(user)
        return self.client.post(
            URL,
            {'dossier': self.dossier.pk, 'type': type_doc, 'fichier': fichier or pdf()},
            format='multipart',
        )

    def test_depot_pdf_ok(self):
        r = self.deposer(self.transitaire)
        self.assertEqual(r.status_code, 201, r.data)
        doc = DocumentDossier.objects.get()
        self.assertEqual(doc.nom_fichier, 'facture.pdf')
        self.assertNotIn('facture', doc.fichier.name)  # le nom stocké est aléatoire

    def test_extension_interdite(self):
        r = self.deposer(self.transitaire, SimpleUploadedFile('virus.exe', b'MZ0000'))
        self.assertEqual(r.status_code, 400)
        self.assertEqual(DocumentDossier.objects.count(), 0)

    def test_faux_pdf_refuse(self):
        r = self.deposer(self.transitaire, pdf('faux.pdf', b'ceci est du texte'))
        self.assertEqual(r.status_code, 400)
        self.assertEqual(DocumentDossier.objects.count(), 0)

    def test_fichier_trop_gros(self):
        r = self.deposer(self.transitaire, pdf('gros.pdf', b'%PDF' + b'0' * (5 * 1024 * 1024)))
        self.assertEqual(r.status_code, 400)
        self.assertEqual(DocumentDossier.objects.count(), 0)

    def test_type_invalide(self):
        r = self.deposer(self.transitaire, type_doc='nimporte')
        self.assertEqual(r.status_code, 400)

    def test_autre_transitaire_refuse(self):
        r = self.deposer(self.transitaire2)
        self.assertIn(r.status_code, (403, 404))
        self.assertEqual(DocumentDossier.objects.count(), 0)

    def test_controleur_lit_et_telecharge_mais_ne_depose_pas(self):
        self.assertEqual(self.deposer(self.transitaire).status_code, 201)
        doc = DocumentDossier.objects.get()

        self.se_connecter(self.controleur)
        r = self.client.get(URL, {'dossier': self.dossier.pk})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.data), 1)

        r = self.client.get(f'{URL}{doc.pk}/telecharger/')
        self.assertEqual(r.status_code, 200)
        self.assertTrue(b''.join(r.streaming_content).startswith(b'%PDF'))

        self.assertEqual(self.deposer(self.controleur).status_code, 403)
        self.assertEqual(DocumentDossier.objects.count(), 1)

    def test_demandeur_ne_voit_rien(self):
        self.deposer(self.transitaire)
        self.se_connecter(self.demandeur)
        r = self.client.get(URL, {'dossier': self.dossier.pk})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.data), 0)
        self.assertEqual(self.deposer(self.demandeur).status_code, 404)

    def test_dossier_valide_verrouille(self):
        self.dossier.statut_controle = DossierImportation.StatutControle.VALIDE
        self.dossier.save()
        r = self.deposer(self.transitaire)
        self.assertEqual(r.status_code, 400)
        self.assertEqual(DocumentDossier.objects.count(), 0)

    def test_suppression_par_le_transitaire(self):
        self.deposer(self.transitaire)
        doc = DocumentDossier.objects.get()
        self.se_connecter(self.transitaire)
        r = self.client.delete(f'{URL}{doc.pk}/')
        self.assertEqual(r.status_code, 204)
        self.assertEqual(DocumentDossier.objects.count(), 0)
