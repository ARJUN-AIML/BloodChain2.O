from rest_framework import serializers
from .models import BloodInventory, BloodBatch, FacilityDailyRecord

class BloodInventorySerializer(serializers.ModelSerializer):
    facility_id = serializers.CharField(source='facility.facility_id', read_only=True)
    facility_name = serializers.CharField(source='facility.name', read_only=True)

    class Meta:
        model = BloodInventory
        fields = [
            'id', 'facility_id', 'facility_name', 'blood_group', 'blood_component',
            'available_units', 'reserved_units', 'in_transit_units',
            'expired_units', 'updated_at'
        ]

class BloodBatchSerializer(serializers.ModelSerializer):
    facility_name = serializers.CharField(source='facility.name', read_only=True)

    class Meta:
        model = BloodBatch
        fields = [
            'id', 'batch_id', 'facility_name', 'blood_group', 'blood_component',
            'quantity', 'collection_date', 'expiry_date', 'status', 'created_at'
        ]

class FacilityDailyRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = FacilityDailyRecord
        fields = '__all__'
