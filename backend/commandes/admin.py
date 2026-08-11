from django.contrib import admin

from .models import BonDeCommande, LigneBonDeCommande


class LigneBonDeCommandeInline(admin.TabularInline):
    model = LigneBonDeCommande
    extra = 1


@admin.register(BonDeCommande)
class BonDeCommandeAdmin(admin.ModelAdmin):
    list_display = ('id_bc', 'id_da', 'id_acheteur', 'id_fournisseur', 'montant', 'status', 'date_creation')
    list_filter = ('status',)
    search_fields = ('id_bc',)
    inlines = [LigneBonDeCommandeInline]
