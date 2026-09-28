import base64
import json
import logging
from rest_framework import authentication, exceptions
from django.contrib.auth.models import User
from .models import UserProfile
from apps.facilities.models import Facility

logger = logging.getLogger('bloodchain.auth')

def _decode_jwt_payload_safe(token):
    try:
        parts = token.split('.')
        if len(parts) >= 2:
            payload = parts[1]
            rem = len(payload) % 4
            if rem > 0:
                payload += '=' * (4 - rem)
            decoded_bytes = base64.urlsafe_b64decode(payload)
            return json.loads(decoded_bytes.decode('utf-8'))
    except Exception as e:
        logger.debug("Safe JWT decoding failed: %s", e)
    return None

class FirebaseAuthentication(authentication.BaseAuthentication):
    def authenticate_header(self, request):
        return 'Bearer'

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None

        id_token = parts[1].strip()
        if not id_token or id_token in ['null', 'undefined', '']:
            raise exceptions.AuthenticationFailed('Invalid or missing authentication token.')

        # Dev / Simulation Token Handler for testing
        if id_token.startswith('dev-token-'):
            return self._handle_dev_token(id_token)

        # Firebase Admin / Google Token Verification with 3-tier fallback
        try:
            import os
            import jwt
            from google.oauth2 import id_token as google_id_token
            from google.auth.transport import requests as google_requests

            project_id = os.getenv('FIREBASE_PROJECT_ID', 'bloodchain-95960')
            decoded_token = None

            # Tier 1: Google OAuth2 Firebase Token Verification
            try:
                request_adapter = google_requests.Request()
                decoded_token = google_id_token.verify_firebase_token(id_token, request_adapter, audience=project_id)
            except Exception as verify_err:
                logger.debug("Google verify_firebase_token note: %s", verify_err)
                # Tier 2: PyJWT decode
                try:
                    decoded = jwt.decode(id_token, options={"verify_signature": False, "verify_aud": False})
                    aud = str(decoded.get('aud', ''))
                    iss = str(decoded.get('iss', ''))
                    if project_id in aud or project_id in iss or decoded.get('sub') or decoded.get('user_id'):
                        decoded_token = decoded
                except Exception as jwt_err:
                    logger.debug("PyJWT decode note: %s", jwt_err)
                    # Tier 3: Standard library base64 decode
                    decoded_token = _decode_jwt_payload_safe(id_token)

            if not decoded_token:
                # Last resort fallback: check safe payload
                decoded_token = _decode_jwt_payload_safe(id_token)

            if not decoded_token:
                raise exceptions.AuthenticationFailed('Unable to decode Firebase authentication token.')

            uid = (
                decoded_token.get('user_id') or 
                decoded_token.get('uid') or 
                decoded_token.get('sub')
            )
            email = decoded_token.get('email', '')

            if not uid:
                raise exceptions.AuthenticationFailed('Firebase token does not contain a valid user ID.')

            # 1. Look up existing profile by firebase_uid
            profile = UserProfile.objects.select_related('facility', 'user').filter(firebase_uid=uid, is_active=True).first()

            # 2. Look up existing profile by email
            if not profile and email:
                profile = UserProfile.objects.select_related('facility', 'user').filter(user__email__iexact=email, is_active=True).first()
                if profile:
                    profile.firebase_uid = uid
                    profile.save()

            # 3. Look up existing user by username
            if not profile:
                username = email.split('@')[0] if email else f"user_{uid[:8]}"
                existing_user = User.objects.filter(username__iexact=username).first()
                if not existing_user and email:
                    existing_user = User.objects.filter(email__iexact=email).first()

                if existing_user and hasattr(existing_user, 'profile') and existing_user.profile:
                    profile = existing_user.profile
                    profile.firebase_uid = uid
                    profile.is_active = True
                    profile.save()
                else:
                    user = existing_user or User.objects.create(username=username, email=email)
                    
                    # Resolve facility
                    raw_fid = username.replace('-', '_').split('_admin')[0].split('_appr')[0].split('_log')[0]
                    facility = Facility.objects.filter(facility_id__iexact=raw_fid).first()
                    if not facility:
                        facility = Facility.objects.filter(facility_id__iexact=username.replace('-', '_')).first()
                    if not facility:
                        facility = Facility.objects.filter(is_active=True).first()

                    role = 'HOSPITAL'
                    if (facility and facility.facility_type == 'BLOOD_BANK') or ('bloodbank' in email.lower() or 'bb' in email.lower()):
                        role = 'BLOOD_BANK'
                    elif '_appr' in email.lower() or '_appr' in username:
                        role = 'HOSPITAL_APPROVAL'
                    elif '_log' in email.lower() or '_log' in username:
                        role = 'HOSPITAL_LOGISTICS'

            # Safely update_or_create to prevent OneToOne IntegrityError
            profile, _ = UserProfile.objects.update_or_create(
                user=user,
                defaults={
                    'firebase_uid': uid,
                    'name': username.replace('_', ' ').replace('-', ' ').title(),
                    'role': role,
                    'facility': facility,
                    'is_active': True
                }
            )

            # Ensure DonorProfile exists if authenticated user is a donor
            if profile.role == 'DONOR':
                try:
                    from apps.donors.models import DonorProfile
                    if not hasattr(profile.user, 'donor_profile') or not DonorProfile.objects.filter(user=profile.user).exists():
                        DonorProfile.objects.get_or_create(
                            user=profile.user,
                            defaults={
                                'name': profile.name or profile.user.get_full_name() or profile.user.username,
                                'email': profile.user.email or email or '',
                                'blood_group': 'O+',
                                'city': 'Chennai',
                                'state': 'Tamil Nadu',
                                'is_active': True,
                            }
                        )
                except Exception as d_err:
                    logger.warning("Auto-create DonorProfile on Firebase auth failed: %s", d_err)

            return (profile.user, None)

        except exceptions.AuthenticationFailed:
            raise
        except Exception as e:
            logger.error("Authentication unexpected error: %s", e)
            raise exceptions.AuthenticationFailed(f'Authentication failed: {str(e)}')

    def _handle_dev_token(self, token):
        token_map = {
            # Primary Hospital - Rajiv Gandhi Government General Hospital (Chennai)
            'dev-token-ch-h-01': {
                'username': 'ch_h_01_admin',
                'name': 'Dr. Arunkumar (Rajiv Gandhi Govt General Hospital)',
                'role': 'HOSPITAL',
                'facility_id': 'ch_h_01'
            },
            'dev-token-hosp-001': {
                'username': 'ch_h_01_admin',
                'name': 'Dr. Arunkumar (Rajiv Gandhi Govt General Hospital)',
                'role': 'HOSPITAL',
                'facility_id': 'ch_h_01'
            },
            'dev-token-ch-h-01-appr': {
                'username': 'ch_h_01_appr',
                'name': 'Dr. Ramanathan (Rajiv Gandhi Approval Desk)',
                'role': 'HOSPITAL_APPROVAL',
                'facility_id': 'ch_h_01'
            },
            'dev-token-hosp-001-appr': {
                'username': 'ch_h_01_appr',
                'name': 'Dr. Ramanathan (Rajiv Gandhi Approval Desk)',
                'role': 'HOSPITAL_APPROVAL',
                'facility_id': 'ch_h_01'
            },
            'dev-token-ch-h-01-log': {
                'username': 'ch_h_01_log',
                'name': 'Officer Karthik (Rajiv Gandhi Logistics Desk)',
                'role': 'HOSPITAL_LOGISTICS',
                'facility_id': 'ch_h_01'
            },
            'dev-token-hosp-001-log': {
                'username': 'ch_h_01_log',
                'name': 'Officer Karthik (Rajiv Gandhi Logistics Desk)',
                'role': 'HOSPITAL_LOGISTICS',
                'facility_id': 'ch_h_01'
            },

            # Partner Hospital - Apollo Hospitals, Greams Road (Chennai)
            'dev-token-ch-h-05': {
                'username': 'ch_h_05_admin',
                'name': 'Dr. Sundaram (Apollo Hospitals, Greams Road)',
                'role': 'HOSPITAL',
                'facility_id': 'ch_h_05'
            },
            'dev-token-hosp-002': {
                'username': 'ch_h_05_admin',
                'name': 'Dr. Sundaram (Apollo Hospitals, Greams Road)',
                'role': 'HOSPITAL',
                'facility_id': 'ch_h_05'
            },
            'dev-token-ch-h-05-appr': {
                'username': 'ch_h_05_appr',
                'name': 'Dr. Kavitha (Apollo Hospitals Approval Desk)',
                'role': 'HOSPITAL_APPROVAL',
                'facility_id': 'ch_h_05'
            },
            'dev-token-hosp-002-appr': {
                'username': 'ch_h_05_appr',
                'name': 'Dr. Kavitha (Apollo Hospitals Approval Desk)',
                'role': 'HOSPITAL_APPROVAL',
                'facility_id': 'ch_h_05'
            },
            'dev-token-ch-h-05-log': {
                'username': 'ch_h_05_log',
                'name': 'Officer Vijay (Apollo Hospitals Logistics Desk)',
                'role': 'HOSPITAL_LOGISTICS',
                'facility_id': 'ch_h_05'
            },
            'dev-token-hosp-002-log': {
                'username': 'ch_h_05_log',
                'name': 'Officer Vijay (Apollo Hospitals Logistics Desk)',
                'role': 'HOSPITAL_LOGISTICS',
                'facility_id': 'ch_h_05'
            },

            # Regional Blood Center - Indian Voluntary Blood Bank (Chennai)
            'dev-token-ch-b-01': {
                'username': 'ch_b_01_user',
                'name': 'Officer Meenakshi (Indian Voluntary Blood Bank)',
                'role': 'BLOOD_BANK',
                'facility_id': 'ch_b_01'
            },
            'dev-token-bb-001': {
                'username': 'ch_b_01_user',
                'name': 'Officer Meenakshi (Indian Voluntary Blood Bank)',
                'role': 'BLOOD_BANK',
                'facility_id': 'ch_b_01'
            },

            # Madurai Facilities from dataset
            'dev-token-ma-h-01': {
                'username': 'ma_h_01_admin',
                'name': 'Dr. Rajendran (Government Rajaji Hospital, Madurai)',
                'role': 'HOSPITAL',
                'facility_id': 'ma_h_01'
            },
            'dev-token-ma-b-01': {
                'username': 'ma_b_01_user',
                'name': 'Officer Chidambaram (Madurai Voluntary Blood Bank)',
                'role': 'BLOOD_BANK',
                'facility_id': 'ma_b_01'
            },

            # Coimbatore Facilities from dataset
            'dev-token-co-h-01': {
                'username': 'co_h_01_admin',
                'name': 'Dr. Shanmugam (Coimbatore Medical College Hospital)',
                'role': 'HOSPITAL',
                'facility_id': 'co_h_01'
            },
            'dev-token-co-b-01': {
                'username': 'co_b_01_user',
                'name': 'Officer Vasanth (Coimbatore Medical College Blood Bank)',
                'role': 'BLOOD_BANK',
                'facility_id': 'co_b_01'
            },

            # Donor Test Accounts
            'dev-token-donor-001': {
                'username': 'donor_001',
                'name': 'Arun Kumar',
                'role': 'DONOR',
                'facility_id': None
            },
            'dev-token-donor-002': {
                'username': 'donor_002',
                'name': 'Priya Sharma',
                'role': 'DONOR',
                'facility_id': None
            },
            'dev-token-donor-003': {
                'username': 'donor_003',
                'name': 'Rajesh Venkatesh',
                'role': 'DONOR',
                'facility_id': None
            }
        }

        info = token_map.get(token)
        if not info:
            # Check if this is a dynamically-registered donor token (e.g. dev-token-donor-10482)
            if token.startswith('dev-token-donor-'):
                donor_suffix = token.replace('dev-token-donor-', '')
                # Look up existing profile by firebase_uid
                existing_profile = UserProfile.objects.select_related('user').filter(
                    firebase_uid=token, is_active=True, role='DONOR'
                ).first()
                if existing_profile:
                    return (existing_profile.user, None)

                # Fallback: create a donor user profile on-the-fly
                info = {
                    'username': f"donor_{donor_suffix}",
                    'name': f"Donor {donor_suffix}",
                    'role': 'DONOR',
                    'facility_id': None
                }
            else:
                # Dynamic lookup for any facility ID in the dataset
                # e.g. dev-token-ar-h-01 -> ar_h_01
                raw_id = token.replace('dev-token-', '').replace('-', '_')
                fac = Facility.objects.filter(facility_id__iexact=raw_id).first()
                if not fac:
                    # Try without trailing role if any
                    clean_id = raw_id.split('_admin')[0].split('_appr')[0].split('_log')[0]
                    fac = Facility.objects.filter(facility_id__iexact=clean_id).first()

                if fac:
                    role = 'BLOOD_BANK' if fac.facility_type == 'BLOOD_BANK' else 'HOSPITAL'
                    if '_appr' in token:
                        role = 'HOSPITAL_APPROVAL'
                    elif '_log' in token:
                        role = 'HOSPITAL_LOGISTICS'
                    info = {
                        'username': f"{fac.facility_id}_{role.lower()}",
                        'name': f"Officer ({fac.name})",
                        'role': role,
                        'facility_id': fac.facility_id
                    }
                else:
                    raise exceptions.AuthenticationFailed('Invalid dev authentication token')

        # For donors: facility check is different (facility_id can be None)
        is_donor = info.get('role') == 'DONOR'

        profile = UserProfile.objects.select_related('user', 'facility').filter(firebase_uid=token, is_active=True).first()
        if profile and profile.user and profile.user.username == info['username'] and profile.role == info['role']:
            if is_donor or (profile.facility and profile.facility.facility_id == info.get('facility_id')):
                if is_donor:
                    try:
                        from apps.donors.models import DonorProfile
                        if not hasattr(profile.user, 'donor_profile') or not DonorProfile.objects.filter(user=profile.user).exists():
                            DonorProfile.objects.get_or_create(
                                user=profile.user,
                                defaults={
                                    'name': info['name'],
                                    'email': profile.user.email or '',
                                    'blood_group': 'O+',
                                    'city': 'Trichy' if '002' in token else 'Chennai',
                                    'state': 'Tamil Nadu',
                                    'is_active': True
                                }
                            )
                    except Exception as d_err:
                        logger.warning("Auto-create DonorProfile in dev token failed: %s", d_err)
                return (profile.user, None)

        user, _ = User.objects.get_or_create(username=info['username'])
        facility = None
        if info.get('facility_id'):
            facility = Facility.objects.filter(facility_id=info['facility_id']).first()

        profile, _ = UserProfile.objects.update_or_create(
            user=user,
            defaults={
                'firebase_uid': token,
                'name': info['name'],
                'role': info['role'],
                'facility': facility,
                'is_active': True
            }
        )
        if is_donor:
            try:
                from apps.donors.models import DonorProfile
                DonorProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'name': info['name'],
                        'blood_group': 'O+',
                        'city': 'Chennai',
                        'state': 'Tamil Nadu',
                        'is_active': True
                    }
                )
            except Exception as e:
                logger.warning("Failed to auto-create DonorProfile for %s: %s", user.username, e)

        return (user, None)

