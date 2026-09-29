from rest_framework import generics, permissions
from .models import Facility
from .serializers import FacilitySerializer

class FacilityListView(generics.ListAPIView):
    serializer_class = FacilitySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Facility.objects.filter(is_active=True).order_by('district', 'name')
        facility_type = self.request.query_params.get('type')
        district = self.request.query_params.get('district')
        if facility_type:
            queryset = queryset.filter(facility_type=facility_type.upper())
        if district and district.upper() != 'ALL':
            queryset = queryset.filter(district__iexact=district)
        return queryset
