from django.contrib import admin

from .models import Employe


@admin.register(Employe)
class EmployeAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'email', 'role', 'etat')
    list_filter = ('role', 'etat')
    search_fields = ('nom', 'prenom', 'email')
