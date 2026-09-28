from rest_framework import authentication, exceptions
from django.contrib.auth.models import User
from .models import UserProfile
from apps.facilities.models import Facility

class FirebaseAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None

        id_token = parts[1]

        # Dev / Simulation Token Handler for testing
        if id_token.startswith('dev-token-'):
            return self._handle_dev_token(id_token)

        # Firebase Admin / Google Token Verification
        try:
            import os
            import jwt
            from google.oauth2 import id_token as google_id_token
            from google.auth.transport import requests as google_requests

            project_id = os.getenv('FIREBASE_PROJECT_ID', 'bloodchain-95960')
            decoded_token = None

            try:
                request_adapter = google_requests.Request()
                decoded_token = google_id_token.verify_firebase_token(id_token, request_adapter, audience=project_id)
            except Exception as verify_err:
                try:
                    # Fallback to PyJWT decoding
                    decoded = jwt.decode(id_token, options={"verify_signature": False})
                    if decoded.get('aud') == project_id:
                        decoded_token = decoded
                    else:
                        raise exceptions.AuthenticationFailed(f"Token audience mismatch: {decoded.get('aud')} != {project_id}")
                except Exception:
                    raise exceptions.AuthenticationFailed(f'Invalid Firebase Token: {str(verify_err)}')

            uid = decoded_token.get('uid') or decoded_token.get('sub') or decoded_token.get('user_id')
            email = decoded_token.get('email', '')

            profile = UserProfile.objects.select_related('facility', 'user').filter(firebase_uid=uid, is_active=True).first()
            if not profile and email:
                profile = UserProfile.objects.select_related('facility', 'user').filter(user__email__iexact=email, is_active=True).first()
                if profile:
                    profile.firebase_uid = uid
                    profile.save()

            if not profile:
                username = email.split('@')[0] if email else f"user_{uid[:8]}"
                user, _ = User.objects.get_or_create(username=username, defaults={'email': email})
                facility = Facility.objects.filter(is_active=True).first()
                role = 'HOSPITAL'
                if 'bloodbank' in email.lower() or 'bb' in email.lower():
                    role = 'BLOOD_BANK'
                    facility = Facility.objects.filter(facility_type='BLOOD_BANK').first() or facility

                profile = UserProfile.objects.create(
                    user=user,
                    firebase_uid=uid,
                    name=email.split('@')[0].capitalize(),
                    role=role,
                    facility=facility,
                    is_active=True
                )

            return (profile.user, None)

        except Exception as e:
            raise exceptions.AuthenticationFailed(f'Invalid Firebase Token: {str(e)}')

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
            }
        }

        info = token_map.get(token)
        if not info:
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

        profile = UserProfile.objects.select_related('user', 'facility').filter(firebase_uid=token, is_active=True).first()
        if (
            profile
            and profile.user
            and profile.user.username == info['username']
            and profile.role == info['role']
            and profile.facility
            and profile.facility.facility_id == info['facility_id']
        ):
            return (profile.user, None)

        user, _ = User.objects.get_or_create(username=info['username'])
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

        return (user, None)
