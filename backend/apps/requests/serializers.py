from rest_framework import serializers
from .models import BloodRequest, RequestAllocation
from apps.facilities.serializers import FacilitySerializer

class RequestAllocationSerializer(serializers.ModelSerializer):
    responding_facility_id = serializers.CharField(source='responding_facility.facility_id', read_only=True)
    responding_facility_name = serializers.CharField(source='responding_facility.name', read_only=True)

    class Meta:
        model = RequestAllocation
        fields = [
            'id', 'allocation_id', 'request', 'responding_facility_id',
            'responding_facility_name', 'offered_quantity', 'accepted_quantity',
            'status', 'created_at'
        ]

class BloodRequestSerializer(serializers.ModelSerializer):
    requesting_facility_id = serializers.CharField(source='requesting_facility.facility_id', read_only=True)
    requesting_facility_name = serializers.CharField(source='requesting_facility.name', read_only=True)
    requesting_facility_type = serializers.CharField(source='requesting_facility.facility_type', read_only=True)
    allocations = RequestAllocationSerializer(many=True, read_only=True)
    remaining_quantity = serializers.IntegerField(read_only=True)

    class Meta:
        model = BloodRequest
        fields = [
            'id', 'request_id', 'requesting_facility_id', 'requesting_facility_name',
            'requesting_facility_type', 'blood_group', 'requested_quantity',
            'fulfilled_quantity', 'remaining_quantity', 'required_date',
            'priority', 'reason', 'notes', 'status', 'allocations', 'created_at'
        ]

class CreateBloodRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = BloodRequest
        fields = ['blood_group', 'requested_quantity', 'required_date', 'priority', 'reason', 'notes']

    def validate(self, attrs):
        request = self.context.get('request')
        profile = getattr(request.user, 'profile', None) if request else None

        if not profile or not profile.facility:
            raise serializers.ValidationError("Authenticated facility required.")

        # CRITICAL BLOOD BANK RESTRICTION RULE
        if profile.facility.facility_type == 'BLOOD_BANK':
            raise serializers.ValidationError(
                "Blood Banks are supply facilities and are NOT permitted to request blood from Hospitals."
            )

        if attrs.get('requested_quantity', 0) <= 0:
            raise serializers.ValidationError("Requested quantity must be greater than zero.")

        return attrs

class RespondToRequestSerializer(serializers.Serializer):
    offered_quantity = serializers.IntegerField(min_value=1)
    notes = serializers.CharField(required=False, allow_blank=True)
