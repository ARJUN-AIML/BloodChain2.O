from django.utils import timezone
from rest_framework import views, response, permissions, status
from .models import (
    DonationCamp, CampRegistration, VerifiedDonation,
    DonationCertificate, DonorNotification
)
from .serializers import (
    DonationCampSerializer, CampCreateSerializer,
    CampRegistrationSerializer, VerifiedDonationSerializer,
    DonationCertificateSerializer, CertificatePublicVerifySerializer
)
from apps.donors.models import DonorProfile
from apps.facilities.models import Facility


class CampListView(views.APIView):
    """List active/upcoming camps for the donor map, or create a camp."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """Public endpoint — returns all active/upcoming camps for the donor map."""
        from datetime import timedelta
        now = timezone.now()
        cutoff = now - timedelta(hours=24)

        camps = DonationCamp.objects.filter(
            status__in=['UPCOMING', 'ACTIVE']
        ).select_related('organizer') | DonationCamp.objects.filter(
            status='COMPLETED',
            completed_at__gte=cutoff
        ).select_related('organizer')

        camps = camps.distinct().order_by('-start_datetime')

        # Optional filters
        blood_group = request.query_params.get('blood_group')
        camp_type = request.query_params.get('camp_type')
        organizer_type = request.query_params.get('organizer_type')

        if blood_group:
            camps = camps.filter(required_blood_groups__contains=[blood_group])
        if camp_type:
            camps = camps.filter(camp_type=camp_type.upper())
        if organizer_type:
            camps = camps.filter(organizer__facility_type=organizer_type.upper())

        return response.Response(DonationCampSerializer(camps, many=True).data)


class CampCreateView(views.APIView):
    """Create a new donation camp — only for authenticated facility staff."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile or profile.role == 'DONOR':
            return response.Response(
                {'detail': 'Only facility staff can create camps.'},
                status=status.HTTP_403_FORBIDDEN
            )

        facility = profile.facility
        if not facility:
            return response.Response(
                {'detail': 'No facility associated with this account.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ser = CampCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        camp = DonationCamp(**ser.validated_data, organizer=facility)
        camp.save()

        return response.Response(
            DonationCampSerializer(camp).data,
            status=status.HTTP_201_CREATED
        )


class CampDetailView(views.APIView):
    """Get, update, or cancel a specific camp."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, camp_id):
        try:
            camp = DonationCamp.objects.select_related('organizer').get(camp_id=camp_id)
        except DonationCamp.DoesNotExist:
            return response.Response({'detail': 'Camp not found.'}, status=404)
        return response.Response(DonationCampSerializer(camp).data)

    def patch(self, request, camp_id):
        profile = getattr(request.user, 'profile', None)
        if not profile:
            return response.Response({'detail': 'Auth required.'}, status=401)

        try:
            camp = DonationCamp.objects.get(camp_id=camp_id)
        except DonationCamp.DoesNotExist:
            return response.Response({'detail': 'Camp not found.'}, status=404)

        # Only owner facility can update
        if not profile.facility or camp.organizer != profile.facility:
            return response.Response(
                {'detail': 'You can only modify your own camps.'},
                status=status.HTTP_403_FORBIDDEN
            )

        updatable_fields = [
            'camp_name', 'camp_type', 'urgency', 'status', 'venue_name',
            'venue_address', 'latitude', 'longitude', 'start_datetime',
            'end_datetime', 'required_blood_groups', 'description',
            'contact_phone', 'contact_email', 'max_donors'
        ]
        for field in updatable_fields:
            if field in request.data:
                setattr(camp, field, request.data[field])

        if request.data.get('status') == 'COMPLETED':
            camp.completed_at = timezone.now()

        camp.save()
        return response.Response(DonationCampSerializer(camp).data)

    def delete(self, request, camp_id):
        profile = getattr(request.user, 'profile', None)
        if not profile:
            return response.Response({'detail': 'Auth required.'}, status=401)

        try:
            camp = DonationCamp.objects.get(camp_id=camp_id)
        except DonationCamp.DoesNotExist:
            return response.Response({'detail': 'Camp not found.'}, status=404)

        if not profile.facility or camp.organizer != profile.facility:
            return response.Response(
                {'detail': 'You can only cancel your own camps.'},
                status=status.HTTP_403_FORBIDDEN
            )

        camp.status = 'CANCELLED'
        camp.save()

        # Notify registered donors
        for reg in camp.registrations.filter(status='REGISTERED'):
            DonorNotification.objects.create(
                donor=reg.donor,
                title='Camp Cancelled',
                message=f'{camp.camp_name} has been cancelled.',
                notification_type='CAMP_CANCELLED',
                related_camp=camp
            )

        return response.Response({'status': 'cancelled'})


class FacilityCampsView(views.APIView):
    """List camps owned by the authenticated facility."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.facility or profile.role == 'DONOR':
            return response.Response({'detail': 'Facility staff only.'}, status=403)

        camps = DonationCamp.objects.filter(
            organizer=profile.facility
        ).order_by('-start_datetime')
        return response.Response(DonationCampSerializer(camps, many=True).data)


class CampRegisterView(views.APIView):
    """Register/unregister a donor for a camp."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, camp_id):
        donor = getattr(request.user, 'donor_profile', None)
        if not donor:
            return response.Response({'detail': 'Donor profile required.'}, status=403)

        try:
            camp = DonationCamp.objects.get(camp_id=camp_id)
        except DonationCamp.DoesNotExist:
            return response.Response({'detail': 'Camp not found.'}, status=404)

        if camp.status not in ['UPCOMING', 'ACTIVE']:
            return response.Response(
                {'detail': 'Cannot register for a completed or cancelled camp.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if CampRegistration.objects.filter(camp=camp, donor=donor).exclude(status='CANCELLED').exists():
            return response.Response(
                {'detail': 'Already registered for this camp.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reg = CampRegistration.objects.create(camp=camp, donor=donor)

        DonorNotification.objects.create(
            donor=donor,
            title='Camp Registration Confirmed',
            message=f'You have registered for {camp.camp_name} on {camp.start_datetime.strftime("%b %d, %Y")}.',
            notification_type='CAMP_REGISTERED',
            related_camp=camp
        )

        return response.Response(
            CampRegistrationSerializer(reg).data,
            status=status.HTTP_201_CREATED
        )

    def delete(self, request, camp_id):
        donor = getattr(request.user, 'donor_profile', None)
        if not donor:
            return response.Response({'detail': 'Donor profile required.'}, status=403)

        try:
            reg = CampRegistration.objects.get(
                camp__camp_id=camp_id, donor=donor, status='REGISTERED'
            )
        except CampRegistration.DoesNotExist:
            return response.Response({'detail': 'Registration not found.'}, status=404)

        reg.status = 'CANCELLED'
        reg.save()
        return response.Response({'status': 'cancelled'})


class CampRegistrationsListView(views.APIView):
    """List donors registered for a specific camp — facility staff only."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, camp_id):
        profile = getattr(request.user, 'profile', None)
        if not profile or profile.role == 'DONOR':
            return response.Response({'detail': 'Facility staff only.'}, status=403)

        try:
            camp = DonationCamp.objects.get(camp_id=camp_id)
        except DonationCamp.DoesNotExist:
            return response.Response({'detail': 'Camp not found.'}, status=404)

        if profile.facility and camp.organizer != profile.facility:
            return response.Response(
                {'detail': 'You can only view registrations for your own camps.'},
                status=status.HTTP_403_FORBIDDEN
            )

        regs = CampRegistration.objects.filter(camp=camp).exclude(
            status='CANCELLED'
        ).select_related('donor')
        return response.Response(CampRegistrationSerializer(regs, many=True).data)


class CampCheckInView(views.APIView):
    """Check in a donor at a camp — facility staff only."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, camp_id):
        profile = getattr(request.user, 'profile', None)
        if not profile or profile.role == 'DONOR':
            return response.Response({'detail': 'Facility staff only.'}, status=403)

        try:
            camp = DonationCamp.objects.get(camp_id=camp_id)
        except DonationCamp.DoesNotExist:
            return response.Response({'detail': 'Camp not found.'}, status=404)

        if profile.facility and camp.organizer != profile.facility:
            return response.Response({'detail': 'Not your camp.'}, status=403)

        donor_id = request.data.get('donor_id')
        qr_token = request.data.get('qr_token')

        if not donor_id and not qr_token:
            return response.Response(
                {'detail': 'Provide donor_id or qr_token.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            if qr_token:
                donor = DonorProfile.objects.get(qr_token=qr_token)
            else:
                donor = DonorProfile.objects.get(donor_id=donor_id)
        except DonorProfile.DoesNotExist:
            return response.Response({'detail': 'Donor not found.'}, status=404)

        try:
            reg = CampRegistration.objects.get(camp=camp, donor=donor, status='REGISTERED')
        except CampRegistration.DoesNotExist:
            return response.Response(
                {'detail': 'Donor is not registered for this camp.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reg.status = 'CHECKED_IN'
        reg.checked_in_at = timezone.now()
        reg.checked_in_by = request.user
        reg.save()

        return response.Response({
            'status': 'checked_in',
            'donor_id': donor.donor_id,
            'donor_name': donor.name,
            'camp_id': camp.camp_id,
        })


class DonationVerifyView(views.APIView):
    """Record a verified donation — facility staff only. Auto-generates certificate."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile or profile.role == 'DONOR':
            return response.Response({'detail': 'Facility staff only.'}, status=403)

        donor_id = request.data.get('donor_id')
        camp_id = request.data.get('camp_id')
        blood_group = request.data.get('blood_group', '')
        units = request.data.get('units_donated', 1.0)
        notes = request.data.get('notes', '')

        if not donor_id or not camp_id:
            return response.Response(
                {'detail': 'donor_id and camp_id are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            donor = DonorProfile.objects.get(donor_id=donor_id)
        except DonorProfile.DoesNotExist:
            return response.Response({'detail': 'Donor not found.'}, status=404)

        try:
            camp = DonationCamp.objects.get(camp_id=camp_id)
        except DonationCamp.DoesNotExist:
            return response.Response({'detail': 'Camp not found.'}, status=404)

        if profile.facility and camp.organizer != profile.facility:
            return response.Response({'detail': 'Not your camp.'}, status=403)

        # Create verified donation
        donation = VerifiedDonation.objects.create(
            donor=donor,
            camp=camp,
            facility=profile.facility,
            blood_group=blood_group or donor.blood_group,
            units_donated=units,
            donation_datetime=timezone.now(),
            verified_by=request.user,
            notes=notes
        )

        # Update camp registration if exists
        reg = CampRegistration.objects.filter(camp=camp, donor=donor).first()
        if reg:
            reg.status = 'COMPLETED'
            reg.save()
            donation.camp_registration = reg
            donation.save()

        # Auto-generate certificate
        cert = DonationCertificate.objects.create(
            donation=donation,
            donor=donor,
            facility_name=profile.facility.name if profile.facility else 'BloodChain Network',
            camp_name=camp.camp_name,
            donation_date=donation.donation_datetime.date()
        )

        # Notify donor
        DonorNotification.objects.create(
            donor=donor,
            title='Donation Verified',
            message=f'Your blood donation at {camp.camp_name} has been verified. Certificate {cert.certificate_id} is now available.',
            notification_type='DONATION_VERIFIED',
            related_camp=camp,
            related_donation=donation
        )

        DonorNotification.objects.create(
            donor=donor,
            title='Certificate Ready',
            message=f'Download your donation certificate #{cert.certificate_id}.',
            notification_type='CERTIFICATE_READY',
            related_donation=donation
        )

        # Check new achievements
        count = donor.verified_donation_count
        achievement_thresholds = {
            1: 'First Donation 🩸',
            3: 'Regular Donor ❤️',
            5: 'Bronze Lifesaver 🥉',
            10: 'Silver Lifesaver 🥈',
            20: 'Gold Lifesaver 🥇',
        }
        if count in achievement_thresholds:
            DonorNotification.objects.create(
                donor=donor,
                title='Achievement Unlocked!',
                message=f'You earned the "{achievement_thresholds[count]}" achievement!',
                notification_type='ACHIEVEMENT_UNLOCKED'
            )

        return response.Response(
            VerifiedDonationSerializer(donation).data,
            status=status.HTTP_201_CREATED
        )


class CertificatePublicVerifyView(views.APIView):
    """Public endpoint to verify a certificate by its QR token."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, qr_token):
        try:
            cert = DonationCertificate.objects.select_related('donor').get(qr_token=qr_token)
        except DonationCertificate.DoesNotExist:
            return response.Response({'detail': 'Certificate not found.'}, status=404)
        return response.Response(CertificatePublicVerifySerializer(cert).data)
