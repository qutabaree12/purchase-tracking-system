import datetime

from authentication.models import Employe
from commandes.models import DossierImportation, LigneBonDeCommande, LigneReception, Reception
from commandes.test_securite import BaseTest, creer_employe
from notifications.models import Notification
from produits.models import Produit

Statut = DossierImportation.Statut
Controle = DossierImportation.StatutControle


class ReceptionParLigneTest(BaseTest):
    def setUp(self):
        super().setUp()
        self.da = self.creer_da_approuvee()
        self.bc = self.creer_bc(da=self.da)
        self.produit2 = Produit.objects.create(
            nom_produit='Switch', prix_unit=50, id_fournisseur=self.fournisseur)
        self.l1 = LigneBonDeCommande.objects.create(num_ligne_bc=1, id_bc=self.bc, num_produit=self.produit, qte=10)
        self.l2 = LigneBonDeCommande.objects.create(num_ligne_bc=2, id_bc=self.bc, num_produit=self.produit2, qte=5)
        self.dossier = self.bc.dossier_importation
        self.dossier.id_transitaire = self.transitaire
        self.dossier.statut = Statut.EN_COURS
        self.dossier.statut_controle = Controle.VALIDE
        self.dossier.save()
        self.url_dossier = f'/api/dossiers-importation/{self.dossier.pk}/'

    def recevoir(self, lignes, user=None, **extra):
        self.se_connecter(user or self.transitaire)
        data = {'id_dossier': self.dossier.pk, 'lignes': lignes}
        data.update(extra)
        return self.client.post('/api/receptions/', data, format='json')

    def ligne(self, ligne, quantite, **extra):
        return {'num_ligne_bc': ligne.pk, 'quantite': quantite, **extra}

    # -- réceptions partielles puis complète ----------------------------------
    def test_reception_partielle_puis_complete(self):
        r = self.recevoir([self.ligne(self.l1, 4)])
        self.assertEqual(r.status_code, 201, r.data)
        self.assertFalse(r.data['complet'])
        restant = {l['num_ligne_bc']: l['restant'] for l in r.data['lignes']}
        self.assertEqual(restant, {self.l1.pk: 6, self.l2.pk: 5})
        self.dossier.refresh_from_db()
        self.assertEqual(self.dossier.statut, Statut.EN_COURS)
        self.assertIsNone(self.dossier.date_reception_reelle)
        self.assertTrue(Notification.objects.filter(destinataire=self.acheteur, titre='Réception partielle').exists())

        r = self.recevoir([self.ligne(self.l1, 6), self.ligne(self.l2, 2, reserve='2 cartons abîmés')])
        self.assertEqual(r.status_code, 201, r.data)
        self.assertFalse(r.data['complet'])

        r = self.recevoir([self.ligne(self.l2, 3)])
        self.assertEqual(r.status_code, 201, r.data)
        self.assertTrue(r.data['complet'])
        self.dossier.refresh_from_db()
        self.assertEqual(self.dossier.statut, Statut.LIVRE)
        self.assertEqual(self.dossier.date_reception_reelle, datetime.date.today())
        self.assertEqual(Reception.objects.filter(id_dossier=self.dossier).count(), 3)
        self.assertTrue(Notification.objects.filter(destinataire=self.demandeur, titre='Marchandise livrée').exists())

    # -- règles ---------------------------------------------------------------
    def test_depassement_refuse_et_rien_enregistre(self):
        r = self.recevoir([self.ligne(self.l1, 11)])
        self.assertEqual(r.status_code, 400)
        self.assertIn('dépasse', r.data['detail'])
        self.assertEqual(Reception.objects.count(), 0)

    def test_depassement_cumule_refuse(self):
        self.recevoir([self.ligne(self.l1, 8)])
        r = self.recevoir([self.ligne(self.l1, 3)])
        self.assertEqual(r.status_code, 400)
        self.assertEqual(LigneReception.objects.filter(ligne_bc=self.l1).count(), 1)

    def test_lignes_invalides_refusees(self):
        autre_bc = self.creer_bc(fournisseur=self.fournisseur_b)
        etrangere = LigneBonDeCommande.objects.create(num_ligne_bc=9, id_bc=autre_bc, num_produit=self.produit, qte=5)
        cas = [
            [],                                             # vide
            [self.ligne(self.l1, 0)],                       # quantité nulle
            [self.ligne(self.l1, -2)],                      # quantité négative
            [self.ligne(self.l1, 1), self.ligne(self.l1, 1)],   # ligne doublée
            [self.ligne(etrangere, 1)],                     # ligne d'un autre BC
            [{'num_ligne_bc': 'x', 'quantite': 1}],         # numéro invalide
            [{'num_ligne_bc': self.l1.pk}],                 # quantité absente
        ]
        for lignes in cas:
            self.assertEqual(self.recevoir(lignes).status_code, 400, lignes)
        self.assertEqual(Reception.objects.count(), 0)

    def test_reception_impossible_sans_controle_valide(self):
        self.dossier.statut_controle = Controle.A_VERIFIER
        self.dossier.save()
        self.assertEqual(self.recevoir([self.ligne(self.l1, 1)]).status_code, 400)

    def test_reception_bloquee_si_autorisation_manquante(self):
        self.dossier.autorisation_necessaire = True
        self.dossier.autorisation_obtenue = False
        self.dossier.save()
        r = self.recevoir([self.ligne(self.l1, 1)])
        self.assertEqual(r.status_code, 400)
        self.assertIn('autorisation', r.data['detail'].lower())

    def test_dossier_deja_livre_refuse(self):
        self.dossier.statut = Statut.LIVRE
        self.dossier.save()
        self.assertEqual(self.recevoir([self.ligne(self.l1, 1)]).status_code, 400)

    # -- droits ---------------------------------------------------------------
    def test_autres_roles_et_autre_transitaire_refuses(self):
        for user in (self.acheteur, self.demandeur):
            self.assertEqual(self.recevoir([self.ligne(self.l1, 1)], user=user).status_code, 403, user.role)
        r = self.recevoir([self.ligne(self.l1, 1)], user=self.transitaire2)
        self.assertEqual(r.status_code, 404)
        self.assertEqual(Reception.objects.count(), 0)

    def test_liste_a_recevoir(self):
        self.se_connecter(self.transitaire)
        r = self.client.get('/api/receptions/a-recevoir/')
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual([d['id_dossier'] for d in r.data], [self.dossier.pk])
        self.assertEqual(r.data[0]['lignes'][0]['commande'], 10)
        self.assertIsNone(r.data[0]['bloque'])
        self.se_connecter(self.transitaire2)
        self.assertEqual(self.client.get('/api/receptions/a-recevoir/').data, [])
        self.se_connecter(self.acheteur)
        self.assertEqual(self.client.get('/api/receptions/a-recevoir/').status_code, 403)

    def test_dossier_livre_disparait_de_a_recevoir(self):
        self.recevoir([self.ligne(self.l1, 10), self.ligne(self.l2, 5)])
        self.se_connecter(self.transitaire)
        self.assertEqual(self.client.get('/api/receptions/a-recevoir/').data, [])

    def test_historique_visible_par_l_acheteur_seulement_pour_ses_bc(self):
        self.recevoir([self.ligne(self.l1, 4)])
        self.se_connecter(self.acheteur)
        r = self.client.get(f'/api/receptions/?dossier={self.dossier.pk}')
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual(len(r.data), 1)
        self.assertEqual(r.data[0]['lignes'][0]['quantite_recue'], 4)
        self.assertEqual(r.data[0]['bc_reference'], self.bc.reference)
        self.se_connecter(self.acheteur2)
        self.assertEqual(self.client.get('/api/receptions/').data, [])
        self.se_connecter(self.demandeur)
        self.assertEqual(self.client.get('/api/receptions/').data, [])

    # -- compatibilité avec le bouton « Valider la réception » ------------------
    def test_valider_reception_receptionne_tout_le_reste(self):
        self.recevoir([self.ligne(self.l1, 4)])
        self.se_connecter(self.transitaire)
        r = self.client.post(self.url_dossier + 'valider_reception/')
        self.assertEqual(r.status_code, 200, r.data)
        self.dossier.refresh_from_db()
        self.assertEqual(self.dossier.statut, Statut.LIVRE)
        total = {self.l1.pk: 0, self.l2.pk: 0}
        for l in LigneReception.objects.all():
            total[l.ligne_bc_id] += l.quantite_recue
        self.assertEqual(total, {self.l1.pk: 10, self.l2.pk: 5})
        r = self.client.post(self.url_dossier + 'valider_reception/')
        self.assertEqual(r.status_code, 400)

    def test_valider_reception_sans_lignes_fonctionne_comme_avant(self):
        bc = self.creer_bc(fournisseur=self.fournisseur_b)       # BC sans aucune ligne
        d = bc.dossier_importation
        d.id_transitaire = self.transitaire
        d.statut = Statut.EN_COURS
        d.statut_controle = Controle.VALIDE
        d.save()
        self.se_connecter(self.transitaire)
        r = self.client.post(f'/api/dossiers-importation/{d.pk}/valider_reception/')
        self.assertEqual(r.status_code, 200, r.data)
        d.refresh_from_db()
        self.assertEqual(d.statut, Statut.LIVRE)
