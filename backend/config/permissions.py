from rest_framework.permissions import BasePermission


def roles_autorises(*roles):
    """Fabrique une permission DRF qui n'accepte que les rôles indiqués."""

    class RolePermission(BasePermission):
        message = "Votre rôle ne permet pas cette action."

        def has_permission(self, request, view):
            user = request.user
            return bool(
                user
                and getattr(user, 'is_authenticated', False)
                and getattr(user, 'role', None) in roles
            )

    return RolePermission


def lecture_pour_tous_ecriture_roles(*roles):
    """Lecture pour tout utilisateur connecté, écriture réservée aux rôles indiqués."""
    from rest_framework.permissions import SAFE_METHODS

    class LectureOuRoles(BasePermission):
        message = "Votre rôle ne permet pas de modifier ces données."

        def has_permission(self, request, view):
            user = request.user
            if not (user and getattr(user, 'is_authenticated', False)):
                return False
            if request.method in SAFE_METHODS:
                return True
            return getattr(user, 'role', None) in roles

    return LectureOuRoles
