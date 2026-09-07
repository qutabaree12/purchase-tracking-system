from rest_framework.pagination import PageNumberPagination


class OptionalPagination(PageNumberPagination):
    """Pagination OPTIONNELLE et rétro-compatible.

    - Sans paramètre ``?page=``  -> reponse = tableau complet (comportement actuel).
      Le tableau de bord, les listes et les menus déroulants continuent de
      fonctionner à l'identique (aucune casse).
    - Avec ``?page=N&page_size=M`` -> reponse DRF paginée
      ``{ count, next, previous, results }`` : le client peut borner la charge
      lorsque le volume de données grandira.
    """

    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200

    def paginate_queryset(self, queryset, request, view=None):
        if 'page' not in request.query_params:
            return None
        return super().paginate_queryset(queryset, request, view=view)
