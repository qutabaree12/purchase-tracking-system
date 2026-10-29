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
