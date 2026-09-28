from rest_framework import serializers, generics, permissions
from .models import Facility

class FacilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Facility
        fields = ['facility_id', 'name', 'facility_type', 'district', 'address', 'is_active']

class FacilityListView(generics.ListAPIView):
    serializer_class = FacilitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Facility.objects.filter(is_active=True)
        facility_type = self.request.query_params.get('type')
        if facility_type:
            queryset = queryset.filter(facility_type=facility_type.upper())
        return queryset
