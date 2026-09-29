from rest_framework import serializers
from .models import (
    DonationCamp, CampRegistration, VerifiedDonation,
    DonationCertificate, DonorNotification
)
from apps.facilities.serializers import FacilitySerializer


class DonationCampSerializer(serializers.ModelSerializer):
    organizer_name = serializers.CharField(source='organizer.name', read_only=True)
    organizer_type = serializers.CharField(source='organizer.facility_type', read_only=True)
    organizer_id = serializers.CharField(source='organizer.facility_id', read_only=True)
    organizer_district = serializers.CharField(source='organizer.district', read_only=True)
    registered_count = serializers.ReadOnlyField()
    checked_in_count = serializers.ReadOnlyField()

    class Meta:
        model = DonationCamp
        fields = [
            'camp_id', 'camp_name', 'organizer_id', 'organizer_name',
            'organizer_type', 'organizer_district', 'camp_type', 'urgency', 'status',
            'venue_name', 'venue_address', 'latitude', 'longitude',
            'start_datetime', 'end_datetime', 'required_blood_groups',
            'description', 'contact_phone', 'contact_email',
            'max_donors', 'registered_count', 'checked_in_count',
            'created_at', 'updated_at', 'completed_at'
        ]
        read_only_fields = ['camp_id', 'created_at', 'updated_at', 'completed_at']


class CampCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonationCamp
        fields = [
            'camp_name', 'camp_type', 'urgency', 'venue_name',
            'venue_address', 'latitude', 'longitude',
            'start_datetime', 'end_datetime', 'required_blood_groups',
            'description', 'contact_phone', 'contact_email', 'max_donors'
        ]


class CampRegistrationSerializer(serializers.ModelSerializer):
    donor_id = serializers.CharField(source='donor.donor_id', read_only=True)
    donor_name = serializers.CharField(source='donor.name', read_only=True)
    donor_blood_group = serializers.CharField(source='donor.blood_group', read_only=True)
    camp_id = serializers.CharField(source='camp.camp_id', read_only=True)
    camp_name = serializers.CharField(source='camp.camp_name', read_only=True)
    camp_start = serializers.DateTimeField(source='camp.start_datetime', read_only=True)
    camp_end = serializers.DateTimeField(source='camp.end_datetime', read_only=True)
    camp_venue = serializers.CharField(source='camp.venue_name', read_only=True)
    camp_status = serializers.CharField(source='camp.status', read_only=True)
    camp_type = serializers.CharField(source='camp.camp_type', read_only=True)
    organizer_name = serializers.CharField(source='camp.organizer.name', read_only=True)
    organizer_type = serializers.CharField(source='camp.organizer.facility_type', read_only=True)

    class Meta:
        model = CampRegistration
        fields = [
            'id', 'qr_token', 'camp_id', 'camp_name', 'camp_start', 'camp_end',
            'camp_venue', 'camp_status', 'camp_type',
            'organizer_name', 'organizer_type',
            'donor_id', 'donor_name', 'donor_blood_group',
            'status', 'preferred_timeslot', 'notes', 'registered_at', 'checked_in_at'
        ]


class VerifiedDonationSerializer(serializers.ModelSerializer):
    donor_id = serializers.CharField(source='donor.donor_id', read_only=True)
    donor_name = serializers.CharField(source='donor.name', read_only=True)
    camp_name = serializers.CharField(source='camp.camp_name', read_only=True)
    camp_id = serializers.CharField(source='camp.camp_id', read_only=True)
    facility_name = serializers.CharField(source='facility.name', read_only=True)
    facility_type = serializers.CharField(source='facility.facility_type', read_only=True)
    camp_type = serializers.CharField(source='camp.camp_type', read_only=True)
    has_certificate = serializers.SerializerMethodField()
    certificate_id = serializers.SerializerMethodField()

    class Meta:
        model = VerifiedDonation
        fields = [
            'donation_id', 'donor_id', 'donor_name',
            'camp_id', 'camp_name', 'camp_type',
            'facility_name', 'facility_type',
            'blood_group', 'units_donated', 'donation_datetime',
            'verified_at', 'notes', 'has_certificate', 'certificate_id'
        ]

    def get_has_certificate(self, obj):
        return hasattr(obj, 'certificate') and obj.certificate is not None

    def get_certificate_id(self, obj):
        try:
            return obj.certificate.certificate_id
        except Exception:
            return None


class DonationCertificateSerializer(serializers.ModelSerializer):
    donor_id = serializers.CharField(source='donor.donor_id', read_only=True)
    donor_name = serializers.CharField(source='donor.name', read_only=True)
    donation_id = serializers.CharField(source='donation.donation_id', read_only=True)

    class Meta:
        model = DonationCertificate
        fields = [
            'certificate_id', 'donation_id', 'donor_id', 'donor_name',
            'facility_name', 'camp_name', 'donation_date',
            'qr_token', 'created_at'
        ]


class DonorNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonorNotification
        fields = [
            'id', 'title', 'message', 'notification_type',
            'is_read', 'created_at'
        ]


class CertificatePublicVerifySerializer(serializers.ModelSerializer):
    """Minimal info for public certificate verification."""
    donor_name = serializers.CharField(source='donor.name', read_only=True)

    class Meta:
        model = DonationCertificate
        fields = [
            'certificate_id', 'donor_name', 'facility_name',
            'camp_name', 'donation_date', 'created_at'
        ]
