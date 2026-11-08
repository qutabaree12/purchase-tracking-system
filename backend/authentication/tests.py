from django.test import TestCase
from rest_framework.test import APIClient

from .models import Employe


class LoginEmailTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.employe = Employe.objects.create(
            nom_emp='Bensalem',
            prenom_emp='Amel',
            email_emp='amel.bensalem@algerietelecom.dz',
            role=Employe.Role.CONTROLEUR,
            etat=Employe.Etat.ACTIF,
        )
        self.employe.set_password('pass123')
        self.employe.save(update_fields=['mot_de_passe'])

    def test_login_avec_email(self):
        response = self.client.post(
            '/api/auth/login',
            {'email': 'amel.bensalem@algerietelecom.dz', 'mot_de_passe': 'pass123'},
            format='json',
        )
        self.assertEqual(response.status_code, 200, getattr(response, 'data', response.content))
        self.assertEqual(response.data['user']['role'], 'controleur')
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_insensible_a_la_casse(self):
        response = self.client.post(
            '/api/auth/login',
            {'email': 'AMEL.BENSALEM@ALGERIETELECOM.DZ', 'mot_de_passe': 'pass123'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)

    def test_login_mauvais_mot_de_passe(self):
        response = self.client.post(
            '/api/auth/login',
            {'email': 'amel.bensalem@algerietelecom.dz', 'mot_de_passe': 'mauvais'},
            format='json',
        )
        self.assertEqual(response.status_code, 400)

    def test_login_compte_archive(self):
        self.employe.etat = Employe.Etat.ARCHIVE
        self.employe.save(update_fields=['etat'])
        response = self.client.post(
            '/api/auth/login',
            {'email': 'amel.bensalem@algerietelecom.dz', 'mot_de_passe': 'pass123'},
            format='json',
        )
        self.assertEqual(response.status_code, 400)
