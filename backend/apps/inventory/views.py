from datetime import date, timedelta
from django.db.models import Sum, Count, Avg
from rest_framework import generics, permissions, response, views, pagination
from .models import BloodInventory, BloodBatch, FacilityDailyRecord
from .serializers import BloodInventorySerializer, BloodBatchSerializer, FacilityDailyRecordSerializer

class StandardResultsSetPagination(pagination.PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 500

class InventoryListView(generics.ListAPIView):
    serializer_class = BloodInventorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
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

class FacilityDailyRecordListView(generics.ListAPIView):
    serializer_class = FacilityDailyRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        qs = FacilityDailyRecord.objects.all().order_by('-date')
        fid = self.request.query_params.get('facility_id')
        if fid:
            qs = qs.filter(facility_id=fid)
        bg = self.request.query_params.get('blood_group')
        if bg:
            qs = qs.filter(blood_group=bg)
        comp = self.request.query_params.get('blood_component')
        if comp:
            qs = qs.filter(blood_component=comp)
        return qs

class BloodComponentAnalyticsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        fid = request.query_params.get('facility_id')
        qs = FacilityDailyRecord.objects.all()
        if fid:
            qs = qs.filter(facility_id=fid)

        stats = qs.values('blood_component').annotate(
            total_records=Count('id'),
            total_requested=Sum('units_requested'),
            total_issued=Sum('units_issued'),
            total_received=Sum('units_received'),
            total_transferred=Sum('units_transferred_out'),
            total_expired=Sum('units_expired'),
            avg_stock=Avg('available_stock')
        ).order_by('-total_records')

        return response.Response({
            'facility_filter': fid or 'ALL',
            'components_summary': list(stats)
        })

