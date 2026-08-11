from django.contrib import admin

from .models import DemandeAchat, LigneDemandeAchat, LettreRejet


class LigneDemandeAchatInline(admin.TabularInline):
    model = LigneDemandeAchat
    extra = 1


@admin.register(DemandeAchat)
class DemandeAchatAdmin(admin.ModelAdmin):
    list_display = ('id_da', 'numero_da', 'objet', 'id_demandeur', 'statut', 'date_creation')
    list_filter = ('statut',)
    search_fields = ('numero_da', 'objet')
    inlines = [LigneDemandeAchatInline]


@admin.register(LettreRejet)
class LettreRejetAdmin(admin.ModelAdmin):
    list_display = ('id_lrej', 'id_da', 'id_acheteur', 'date_rej', 'motif')
    search_fields = ('motif',)
