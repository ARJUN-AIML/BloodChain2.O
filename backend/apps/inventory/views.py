from datetime import date, timedelta
from rest_framework import generics, permissions, response, views
from .models import BloodInventory, BloodBatch
from .serializers import BloodInventorySerializer, BloodBatchSerializer

class InventoryListView(generics.ListAPIView):
    serializer_class = BloodInventorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Strict Facility Data Isolation: Only return authenticated user's facility inventory
        profile = getattr(self.request.user, 'profile', None)
        if not profile or not profile.facility:
            return BloodInventory.objects.none()
        return BloodInventory.objects.filter(facility=profile.facility)

class ExpiryAlertsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.facility:
            return response.Response({'detail': 'Profile facility not found'}, status=400)

        facility = profile.facility
        today = date.today()
        soon_limit = today + timedelta(days=7)

        expired_batches = BloodBatch.objects.filter(
            facility=facility,
            expiry_date__lt=today
        ).exclude(status__in=['EXPIRED', 'UNUSABLE'])

        expiring_soon_batches = BloodBatch.objects.filter(
            facility=facility,
            expiry_date__gte=today,
            expiry_date__lte=soon_limit
        ).exclude(status__in=['EXPIRED', 'UNUSABLE'])

        return response.Response({
            'facility_id': facility.facility_id,
            'facility_name': facility.name,
            'expired_count': expired_batches.count(),
            'expiring_soon_count': expiring_soon_batches.count(),
            'expired_batches': BloodBatchSerializer(expired_batches, many=True).data,
            'expiring_soon_batches': BloodBatchSerializer(expiring_soon_batches, many=True).data,
        })
