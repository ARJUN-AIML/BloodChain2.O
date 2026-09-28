from rest_framework import serializers
from .models import DonorProfile


class DonorProfileSerializer(serializers.ModelSerializer):
    member_since_year = serializers.ReadOnlyField()
    verified_donation_count = serializers.ReadOnlyField()
    certificates_count = serializers.ReadOnlyField()
    achievements = serializers.ReadOnlyField()

    class Meta:
        model = DonorProfile
        fields = [
            'donor_id', 'name', 'phone', 'email', 'blood_group',
            'date_of_birth', 'gender', 'address', 'city', 'state',
            'qr_token', 'is_active', 'created_at', 'updated_at',
            'member_since_year', 'verified_donation_count',
            'certificates_count', 'achievements'
        ]
        read_only_fields = ['donor_id', 'qr_token', 'created_at', 'updated_at']


class DonorRegistrationSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)
    phone = serializers.CharField(max_length=20, required=False, default='')
    blood_group = serializers.CharField(max_length=5, required=False, default='')
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    gender = serializers.CharField(max_length=1, required=False, default='')
    city = serializers.CharField(max_length=100, required=False, default='')


class DonorLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class DonorProfileUpdateSerializer(serializers.ModelSerializer):
    date_of_birth = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = DonorProfile
        fields = [
            'name', 'phone', 'email', 'blood_group', 'date_of_birth',
            'gender', 'address', 'city', 'state'
        ]

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'date_of_birth' in data:
            val = data.get('date_of_birth')
            if val == '' or val is None:
                data['date_of_birth'] = None
            elif isinstance(val, str) and '-' in val:
                parts = val.strip().split('-')
                # If format is DD-MM-YYYY (e.g. 01-07-2006)
                if len(parts) == 3 and len(parts[0]) <= 2 and len(parts[2]) == 4:
                    data['date_of_birth'] = f"{parts[2]}-{parts[1].zfill(2)}-{parts[0].zfill(2)}"
        return super().to_internal_value(data)


class DonorPublicVerifySerializer(serializers.ModelSerializer):
    """Minimal info returned when QR is scanned by facility staff."""
    class Meta:
        model = DonorProfile
        fields = ['donor_id', 'name', 'blood_group', 'is_active', 'created_at']
