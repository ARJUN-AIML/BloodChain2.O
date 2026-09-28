from rest_framework import generics, permissions
from .models import AuditLog
from .serializers import AuditLogSerializer

class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        profile = getattr(self.request.user, 'profile', None)
        if not profile or not profile.facility:
            return AuditLog.objects.none()
        return AuditLog.objects.filter(facility=profile.facility)
