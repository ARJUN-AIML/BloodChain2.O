from rest_framework import permissions

class IsHospital(permissions.BasePermission):
    """Allows any hospital role (Admin, Approval, or Logistics)."""
    def has_permission(self, request, view):
        profile = getattr(request.user, 'profile', None)
        return bool(profile and profile.role in ['HOSPITAL', 'HOSPITAL_APPROVAL', 'HOSPITAL_LOGISTICS'])

class IsHospitalApproval(permissions.BasePermission):
    """Allows Hospital Approval Desk users and Hospital Admins."""
    def has_permission(self, request, view):
        profile = getattr(request.user, 'profile', None)
        return bool(profile and profile.role in ['HOSPITAL_APPROVAL', 'HOSPITAL'])

class IsHospitalLogistics(permissions.BasePermission):
    """Allows Hospital Logistics users and Hospital Admins."""
    def has_permission(self, request, view):
        profile = getattr(request.user, 'profile', None)
        return bool(profile and profile.role in ['HOSPITAL_LOGISTICS', 'HOSPITAL', 'BLOOD_BANK'])

class IsBloodBank(permissions.BasePermission):
    """Allows Blood Bank users."""
    def has_permission(self, request, view):
        profile = getattr(request.user, 'profile', None)
        return bool(profile and profile.role == 'BLOOD_BANK')

class FacilityDataIsolationPermission(permissions.BasePermission):
    """Strictly enforces that access is limited to objects matching user's facility."""
    def has_object_permission(self, request, view, obj):
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.facility:
            return False

        if hasattr(obj, 'facility'):
            return obj.facility == profile.facility
        elif hasattr(obj, 'requesting_facility'):
            return obj.requesting_facility == profile.facility or getattr(obj, 'responding_facility', None) == profile.facility
        elif hasattr(obj, 'sender_facility'):
            return obj.sender_facility == profile.facility or obj.receiver_facility == profile.facility

        return True
