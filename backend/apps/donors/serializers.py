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
    class Meta:
        model = DonorProfile
        fields = [
            'name', 'phone', 'blood_group', 'date_of_birth',
            'gender', 'address', 'city', 'state'
        ]


class DonorPublicVerifySerializer(serializers.ModelSerializer):
    """Minimal info returned when QR is scanned by facility staff."""
    class Meta:
        model = DonorProfile
        fields = ['donor_id', 'name', 'blood_group', 'is_active', 'created_at']
