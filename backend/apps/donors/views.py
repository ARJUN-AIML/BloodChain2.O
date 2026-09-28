from rest_framework import views, response, permissions, status
from django.contrib.auth.models import User
from .models import DonorProfile
from .serializers import (
    DonorProfileSerializer, DonorRegistrationSerializer,
    DonorLoginSerializer, DonorProfileUpdateSerializer,
    DonorPublicVerifySerializer
)
from apps.accounts.models import UserProfile
from apps.camps.models import VerifiedDonation, CampRegistration, DonationCertificate, DonorNotification
from apps.camps.serializers import (
    VerifiedDonationSerializer, CampRegistrationSerializer,
    DonationCertificateSerializer, DonorNotificationSerializer
)


def get_donor_or_auto_create(user):
    """
    Safely retrieve the donor profile for an authenticated user.
    If the user has role 'DONOR' but the DonorProfile record is missing,
    auto-create and link it so the user never encounters a 'Donor profile not found' error.
    """
    if not user or not user.is_authenticated:
        return None

    donor = getattr(user, 'donor_profile', None)
    if not donor:
        try:
            donor = DonorProfile.objects.filter(user=user).first()
        except Exception:
            donor = None

    if not donor:
        profile = getattr(user, 'profile', None)
        if (profile and profile.role == 'DONOR') or UserProfile.objects.filter(user=user, role='DONOR').exists():
            name = (profile.name if profile else None) or user.get_full_name() or user.username
            donor, _ = DonorProfile.objects.get_or_create(
                user=user,
                defaults={
                    'name': name,
                    'email': user.email or '',
                    'blood_group': 'O+',
                    'city': 'Chennai',
                    'state': 'Tamil Nadu',
                    'is_active': True,
                }
            )
    return donor


class DonorRegisterView(views.APIView):
    """Public endpoint for donor registration."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        ser = DonorRegistrationSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data

        email = d['email'].strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            return response.Response(
                {'detail': 'An account with this email already exists.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create Django User
        username = f"donor_{email.split('@')[0]}"
        if User.objects.filter(username=username).exists():
            import random
            username = f"donor_{email.split('@')[0]}_{random.randint(100,999)}"

        user = User.objects.create_user(
            username=username,
            email=email,
            password=d['password']
        )

        # Create DonorProfile
        donor = DonorProfile.objects.create(
            user=user,
            name=d['name'],
            email=email,
            phone=d.get('phone', ''),
            blood_group=d.get('blood_group', ''),
            date_of_birth=d.get('date_of_birth'),
            gender=d.get('gender', ''),
            city=d.get('city', ''),
        )

        # Create UserProfile for auth system
        dev_token = f"dev-token-donor-{donor.donor_id.replace('BC-D-', '')}"
        UserProfile.objects.create(
            user=user,
            firebase_uid=dev_token,
            name=d['name'],
            role='DONOR',
            facility=None,
            is_active=True
        )

        # Create welcome notification
        DonorNotification.objects.create(
            donor=donor,
            title='Welcome to BloodChain!',
            message=f'Your BloodChain Donor ID is {donor.donor_id}. You can now browse donation camps and register to donate blood.',
            notification_type='GENERAL'
        )

        return response.Response({
            'status': 'success',
            'donor_id': donor.donor_id,
            'name': donor.name,
            'token': dev_token,
            'message': f'Donor account created. Your BloodChain ID is {donor.donor_id}'
        }, status=status.HTTP_201_CREATED)


class DonorLoginView(views.APIView):
    """Donor login endpoint."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        ser = DonorLoginSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        email = ser.validated_data['email'].strip().lower()
        password = ser.validated_data['password']

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return response.Response(
                {'detail': 'No donor account found with this email.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.check_password(password):
            return response.Response(
                {'detail': 'Incorrect password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Verify donor profile exists
        profile = getattr(user, 'profile', None)
        if not profile or profile.role != 'DONOR':
            return response.Response(
                {'detail': 'This account is not a donor account.'},
                status=status.HTTP_403_FORBIDDEN
            )

        donor = get_donor_or_auto_create(user)
        if not donor:
            return response.Response(
                {'detail': 'Donor profile not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        token = profile.firebase_uid
        return response.Response({
            'status': 'success',
            'donor_id': donor.donor_id,
            'name': donor.name,
            'token': token
        })


class DonorMeView(views.APIView):
    """Get/update current donor profile."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        donor = get_donor_or_auto_create(request.user)
        if not donor:
            return response.Response(
                {'detail': 'Donor profile not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        ser = DonorProfileSerializer(donor)
        data = ser.data

        # Add impact stats
        donations = donor.verified_donations.all()
        data['impact'] = {
            'verified_donations': donations.count(),
            'facilities_supported': donations.values('facility').distinct().count(),
            'emergency_camps_supported': donations.filter(camp__camp_type='EMERGENCY').count(),
            'camps_attended': donations.values('camp').distinct().count(),
            'certificates': donor.certificates.count(),
            'achievements_count': len(donor.achievements),
        }

        return response.Response(data)

    def patch(self, request):
        donor = get_donor_or_auto_create(request.user)
        if not donor:
            return response.Response(
                {'detail': 'Donor profile not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        ser = DonorProfileUpdateSerializer(donor, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()

        # Also update UserProfile name if changed
        if 'name' in request.data:
            profile = getattr(request.user, 'profile', None)
            if profile:
                profile.name = request.data['name']
                profile.save()

        # Also update User email if changed
        if 'email' in request.data and request.data['email']:
            request.user.email = request.data['email']
            request.user.save()

        return response.Response(DonorProfileSerializer(donor).data)


class DonorQRVerifyView(views.APIView):
    """Verify a donor by QR token — used by facility staff when scanning donor QR."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, qr_token):
        try:
            donor = DonorProfile.objects.get(qr_token=qr_token, is_active=True)
        except DonorProfile.DoesNotExist:
            return response.Response(
                {'detail': 'Donor not found or inactive.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if the requesting user is facility staff
        profile = getattr(request.user, 'profile', None)
        if not profile or profile.role == 'DONOR':
            return response.Response(
                {'detail': 'Only facility staff can verify donors.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check camp registrations for the staff's facility
        facility = profile.facility
        camp_registrations = CampRegistration.objects.filter(
            donor=donor,
            camp__organizer=facility,
            status__in=['REGISTERED', 'CHECKED_IN']
        ).select_related('camp')

        return response.Response({
            'donor_id': donor.donor_id,
            'name': donor.name,
            'blood_group': donor.blood_group,
            'is_active': donor.is_active,
            'verified_donations': donor.verified_donation_count,
            'member_since': donor.member_since_year,
            'camp_registrations': [
                {
                    'camp_id': cr.camp.camp_id,
                    'camp_name': cr.camp.camp_name,
                    'status': cr.status,
                    'registered_at': cr.registered_at,
                }
                for cr in camp_registrations
            ]
        })


class DonorDonationsView(views.APIView):
    """List verified donations for the authenticated donor."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        donor = get_donor_or_auto_create(request.user)
        if not donor:
            return response.Response({'detail': 'Donor profile not found.'}, status=404)
        donations = VerifiedDonation.objects.filter(donor=donor).select_related(
            'camp', 'facility', 'certificate'
        )
        return response.Response(VerifiedDonationSerializer(donations, many=True).data)


class DonorCertificatesView(views.APIView):
    """List certificates for the authenticated donor."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        donor = get_donor_or_auto_create(request.user)
        if not donor:
            return response.Response({'detail': 'Donor profile not found.'}, status=404)
        certs = DonationCertificate.objects.filter(donor=donor).select_related('donation')
        return response.Response(DonationCertificateSerializer(certs, many=True).data)


class DonorAchievementsView(views.APIView):
    """Computed achievements for the authenticated donor."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        donor = get_donor_or_auto_create(request.user)
        if not donor:
            return response.Response({'detail': 'Donor profile not found.'}, status=404)
        return response.Response({
            'achievements': donor.achievements,
            'verified_donation_count': donor.verified_donation_count,
        })


class DonorRegistrationsView(views.APIView):
    """List camp registrations for the authenticated donor."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        donor = get_donor_or_auto_create(request.user)
        if not donor:
            return response.Response({'detail': 'Donor profile not found.'}, status=404)
        regs = CampRegistration.objects.filter(donor=donor).select_related(
            'camp', 'camp__organizer'
        ).order_by('-registered_at')
        return response.Response(CampRegistrationSerializer(regs, many=True).data)


class DonorNotificationsView(views.APIView):
    """List and manage notifications for the authenticated donor."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        donor = get_donor_or_auto_create(request.user)
        if not donor:
            return response.Response({'detail': 'Donor profile not found.'}, status=404)
        notifs = DonorNotification.objects.filter(donor=donor)[:50]
        return response.Response(DonorNotificationSerializer(notifs, many=True).data)

    def patch(self, request):
        """Mark notifications as read."""
        donor = get_donor_or_auto_create(request.user)
        if not donor:
            return response.Response({'detail': 'Donor profile not found.'}, status=404)
        ids = request.data.get('ids', [])
        if ids:
            DonorNotification.objects.filter(donor=donor, id__in=ids).update(is_read=True)
        else:
            DonorNotification.objects.filter(donor=donor, is_read=False).update(is_read=True)
        return response.Response({'status': 'ok'})


class DonorPublicVerifyView(views.APIView):
    """
    Public verification endpoint — accessible without login when a phone/scanner
    scans the QR code on a donor pass, registration card, or ID card.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, identifier):
        import uuid as uuid_lib
        from django.utils import timezone

        donor = None
        try:
            token_uuid = uuid_lib.UUID(identifier)
            donor = DonorProfile.objects.filter(qr_token=token_uuid, is_active=True).first()
        except (ValueError, AttributeError):
            pass

        if not donor:
            donor = DonorProfile.objects.filter(donor_id__iexact=identifier.strip(), is_active=True).first()

        if not donor:
            return response.Response(
                {'detail': 'Donor record not found or inactive.'},
                status=status.HTTP_404_NOT_FOUND
            )

        camp_id = request.query_params.get('camp') or request.query_params.get('camp_id')
        pass_reg = None
        if camp_id:
            pass_reg = donor.camp_registrations.filter(camp__camp_id=camp_id).select_related('camp', 'camp__organizer').first()

        if not pass_reg:
            pass_reg = donor.camp_registrations.filter(
                status__in=['REGISTERED', 'CHECKED_IN']
            ).select_related('camp', 'camp__organizer').first()

        pass_data = None
        if pass_reg:
            pass_data = {
                'camp_id': pass_reg.camp.camp_id,
                'camp_name': pass_reg.camp.camp_name,
                'camp_type': pass_reg.camp.camp_type,
                'venue_name': pass_reg.camp.venue_name,
                'venue_address': pass_reg.camp.venue_address,
                'organizer_name': pass_reg.camp.organizer.name if pass_reg.camp.organizer else 'BloodChain Network',
                'organizer_type': pass_reg.camp.organizer.facility_type if pass_reg.camp.organizer else 'HOSPITAL',
                'start_datetime': pass_reg.camp.start_datetime,
                'end_datetime': pass_reg.camp.end_datetime,
                'preferred_timeslot': getattr(pass_reg, 'preferred_timeslot', '09:00 AM - 10:00 AM'),
                'status': pass_reg.status,
                'registered_at': pass_reg.registered_at,
            }

        verified_donations_count = donor.verified_donation_count
        status_label = 'Verified Donor' if verified_donations_count > 0 else 'Registered Donor'

        return response.Response({
            'status': 'verified',
            'donor_id': donor.donor_id,
            'name': donor.name,
            'blood_group': donor.blood_group,
            'donor_status': status_label,
            'is_verified_donor': verified_donations_count > 0,
            'member_since': donor.member_since_year,
            'city': donor.city,
            'state': donor.state,
            'verified_donations_count': verified_donations_count,
            'lives_impacted': verified_donations_count * 3,
            'certificates_count': donor.certificates.count(),
            'pass_registration': pass_data,
            'verification_timestamp': timezone.now(),
            'network': 'BloodChain Decentralized Blood Safety Network'
        })

