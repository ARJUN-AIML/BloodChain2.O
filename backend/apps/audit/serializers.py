from rest_framework import serializers
from .models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', default='System', read_only=True)
    facility_id = serializers.CharField(source='facility.facility_id', read_only=True)
    facility_name = serializers.CharField(source='facility.name', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user_name', 'facility_id', 'facility_name', 'action',
            'object_type', 'object_id', 'previous_status', 'new_status',
            'details', 'timestamp'
        ]
