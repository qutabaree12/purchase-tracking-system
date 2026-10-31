from commandes.models import BonDeCommande
from commandes.test_securite import BaseTest, AUJOURDHUI
from produits.models import Fournisseur


class ListeBCDossierTest(BaseTest):
    def test_liste_acheteur_expose_transitaire_et_etat_du_dossier(self):
        bc_sans = self.creer_bc(fournisseur=self.fournisseur_b)  # dossier sans transitaire
        bc_avec = self.creer_bc()
        dossier = bc_avec.dossier_importation
        dossier.id_transitaire = self.transitaire
        dossier.statut = 'en cours'
        dossier.save()

        self.se_connecter(self.acheteur)
        r = self.client.get('/api/bons-commande/')
        self.assertEqual(r.status_code, 200, r.data)
        par_id = {b['id_bc']: b for b in r.data}

        sans = par_id[bc_sans.id_bc]
        self.assertIsNone(sans['id_transitaire'])
        self.assertIsNone(sans['transitaire_nom'])
        self.assertEqual(sans['dossier_statut'], 'a traiter')

        avec = par_id[bc_avec.id_bc]
        self.assertEqual(avec['id_transitaire'], self.transitaire.pk)
        self.assertEqual(avec['transitaire_nom'], self.transitaire.full_name)
        self.assertEqual(avec['dossier_statut'], 'en cours')
        self.assertEqual(avec['dossier_controle'], 'a_verifier')
        self.assertIs(avec['dossier_pret'], False)

    def test_bc_sans_dossier_ne_fait_pas_planter_la_liste(self):
        troisieme = Fournisseur.objects.create(nom_fournisseur='Sans dossier')
        bc = BonDeCommande.objects.create(
            id_acheteur=self.acheteur, id_fournisseur=troisieme,
            date_creation=AUJOURDHUI, montant=10,
        )
        self.se_connecter(self.acheteur)
        r = self.client.get('/api/bons-commande/')
        self.assertEqual(r.status_code, 200, r.data)
        ligne = [b for b in r.data if b['id_bc'] == bc.id_bc][0]
        self.assertIsNone(ligne['transitaire_nom'])
        self.assertIsNone(ligne['dossier_statut'])

    def test_detail_bc_expose_aussi_les_champs(self):
        bc = self.creer_bc()
        self.se_connecter(self.acheteur)
        r = self.client.get(f'/api/bons-commande/{bc.id_bc}/')
        self.assertEqual(r.status_code, 200, r.data)
        self.assertIn('transitaire_nom', r.data)
        self.assertIn('dossier_controle', r.data)
