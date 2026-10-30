import datetime

from authentication.models import Employe
from commandes.models import BonDeCommande
from commandes.test_securite import BaseTest, creer_employe
from demandes.models import DemandeAchat, LigneDemandeAchat
from produits.models import Produit

AUJOURDHUI = datetime.date.today()


class LienDaBcTest(BaseTest):
    def setUp(self):
        super().setUp()
        self.produit_b = Produit.objects.create(
            nom_produit='Switch', prix_unit=50, id_fournisseur=self.fournisseur_b
        )
        self.demandeur2 = creer_employe('Demandeurdeux', Employe.Role.DEMANDEUR)

    def da(self, demandeur, lignes):
        da = DemandeAchat.objects.create(
            numero_da=f'DA-T-{DemandeAchat.objects.count() + 1:04d}',
            id_demandeur=demandeur,
            id_acheteur=self.acheteur,
            date_creation=AUJOURDHUI,
            objet='Besoin',
            statut=DemandeAchat.Statut.APPROUVEE,
        )
        for produit, qte in lignes:
            LigneDemandeAchat.objects.create(
                id_da=da, id_produit=produit, designation=produit.nom_produit,
                qte=qte, prix_unit=produit.prix_unit,
            )
        return da

    def regrouper(self, das):
        self.se_connecter(self.acheteur)
        return self.client.post(
            '/api/regroupement/', {'ids_da': [d.pk for d in das]}, format='json'
        )

    def generer(self, das):
        r = self.regrouper(das)
        r2 = self.client.post(
            '/api/bons-commande/generer/', {'paniers': r.data['paniers']}, format='json'
        )
        self.assertEqual(r2.status_code, 201, r2.data)
        return r2

    def test_un_bc_pour_deux_da_du_meme_fournisseur(self):
        da1 = self.da(self.demandeur, [(self.produit, 2)])
        da2 = self.da(self.demandeur2, [(self.produit, 3)])
        r = self.regrouper([da1, da2])
        self.assertEqual(len(r.data['paniers']), 1)
        panier = r.data['paniers'][0]
        self.assertEqual(panier['ids_da'], sorted([da1.pk, da2.pk]))
        self.assertEqual(panier['produits'][0]['quantite'], 5)

        self.generer([da1, da2])
        bc = BonDeCommande.objects.get()
        self.assertEqual({d.pk for d in bc.demandes.all()}, {da1.pk, da2.pk})
        # plus rien à commander
        r = self.regrouper([da1, da2])
        self.assertEqual(r.data['paniers'], [])

    def test_da_multi_fournisseurs_commandee_en_deux_temps(self):
        da = self.da(self.demandeur, [(self.produit, 1), (self.produit_b, 1)])
        r = self.regrouper([da])
        self.assertEqual(len(r.data['paniers']), 2)
        panier_a = next(p for p in r.data['paniers'] if p['fournisseur_id'] == self.fournisseur.pk)
        r = self.client.post('/api/bons-commande/generer/', {'paniers': [panier_a]}, format='json')
        self.assertEqual(r.status_code, 201, r.data)

        r = self.client.get('/api/demandes/')
        item = next(x for x in r.data if x['id_da'] == da.pk)
        self.assertTrue(item['has_bc'])
        self.assertTrue(item['reste_a_commander'])

        r = self.regrouper([da])
        self.assertEqual([p['fournisseur_id'] for p in r.data['paniers']], [self.fournisseur_b.pk])
        r = self.client.post('/api/bons-commande/generer/', {'paniers': r.data['paniers']}, format='json')
        self.assertEqual(r.status_code, 201, r.data)

        r = self.client.get('/api/demandes/')
        item = next(x for x in r.data if x['id_da'] == da.pk)
        self.assertFalse(item['reste_a_commander'])
        self.assertEqual(len(item['suivi']), 2)

    def test_da_non_eligible_refusee(self):
        da_autre = self.da(self.demandeur, [(self.produit_b, 1)])  # uniquement chez B
        self.se_connecter(self.acheteur)
        panier = {
            'fournisseur_id': self.fournisseur.pk,
            'ids_da': [da_autre.pk],
            'produits': [{'produit_id': self.produit.pk, 'quantite': 1}],
        }
        r = self.client.post('/api/bons-commande/generer/', {'paniers': [panier]}, format='json')
        self.assertEqual(r.status_code, 400)
        self.assertEqual(BonDeCommande.objects.count(), 0)

    def test_chaque_demandeur_voit_le_bc_qui_regroupe_sa_da(self):
        da1 = self.da(self.demandeur, [(self.produit, 2)])
        da2 = self.da(self.demandeur2, [(self.produit, 3)])
        self.generer([da1, da2])
        for demandeur, da in ((self.demandeur, da1), (self.demandeur2, da2)):
            self.se_connecter(demandeur)
            r = self.client.get('/api/bons-commande/')
            self.assertEqual(len(r.data), 1)
            self.assertIn(da1.numero_da, r.data[0]['da_reference'])
            self.assertIn(da2.numero_da, r.data[0]['da_reference'])
            r = self.client.get('/api/demandes/')
            self.assertEqual(len(r.data), 1)
            self.assertEqual(len(r.data[0]['suivi']), 1)

    def test_bc_annule_remet_la_da_a_commander(self):
        da = self.da(self.demandeur, [(self.produit, 1)])
        self.generer([da])
        bc = BonDeCommande.objects.get()
        bc.status = BonDeCommande.Statut.ANNULE
        bc.save()
        r = self.regrouper([da])
        self.assertEqual(len(r.data['paniers']), 1)
