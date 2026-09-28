from rest_framework import serializers
from .models import BloodTransfer

class BloodTransferSerializer(serializers.ModelSerializer):
    sender_facility_id = serializers.CharField(source='sender_facility.facility_id', read_only=True)
    sender_facility_name = serializers.CharField(source='sender_facility.name', read_only=True)
    receiver_facility_id = serializers.CharField(source='receiver_facility.facility_id', read_only=True)
    receiver_facility_name = serializers.CharField(source='receiver_facility.name', read_only=True)
    request_id = serializers.CharField(source='request.request_id', read_only=True)
    latest_otp_code = serializers.SerializerMethodField()

    class Meta:
        model = BloodTransfer
        fields = [
            'id', 'transfer_id', 'request_id', 'sender_facility_id', 'sender_facility_name',
            'receiver_facility_id', 'receiver_facility_name', 'blood_group', 'blood_component', 'quantity',
            'status', 'latest_otp_code', 'otp_attempts', 'created_at', 'approved_at', 'dispatched_at',
            'completed_at', 'cancelled_at'
        ]

    def get_latest_otp_code(self, obj):
        """
        Zero-trust handshake rule:
        The OTP is ONLY returned to the SENDER facility (who holds and dispatches with the OTP).
        The RECEIVER facility NEVER receives the OTP over the network; they must obtain it physically 
        from the courier / manifest and submit it for validation.
        """
        request = self.context.get('request')
        if request and hasattr(request, 'user') and hasattr(request.user, 'profile'):
            user_fac = getattr(request.user.profile, 'facility', None)
            if user_fac:
                # If current user is the RECEIVER, hide the OTP!
                if obj.receiver_facility_id == user_fac.facility_id:
                    return None
                # If current user is the SENDER, show the OTP!
                if obj.sender_facility_id == user_fac.facility_id:
                    return obj.latest_otp_code
        return obj.latest_otp_code

class VerifyOTPSerializer(serializers.Serializer):
    otp_code = serializers.CharField(min_length=6, max_length=6)
