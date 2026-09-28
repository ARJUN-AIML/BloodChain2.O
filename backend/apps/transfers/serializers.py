from rest_framework import serializers
from .models import BloodTransfer

class BloodTransferSerializer(serializers.ModelSerializer):
    sender_facility_id = serializers.CharField(source='sender_facility.facility_id', read_only=True)
    sender_facility_name = serializers.CharField(source='sender_facility.name', read_only=True)
    receiver_facility_id = serializers.CharField(source='receiver_facility.facility_id', read_only=True)
    receiver_facility_name = serializers.CharField(source='receiver_facility.name', read_only=True)
    request_id = serializers.CharField(source='request.request_id', read_only=True)

    class Meta:
        model = BloodTransfer
        fields = [
            'id', 'transfer_id', 'request_id', 'sender_facility_id', 'sender_facility_name',
            'receiver_facility_id', 'receiver_facility_name', 'blood_group', 'quantity',
            'status', 'otp_attempts', 'created_at', 'approved_at', 'dispatched_at',
            'completed_at', 'cancelled_at'
        ]

class VerifyOTPSerializer(serializers.Serializer):
    otp_code = serializers.CharField(min_length=6, max_length=6)
