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

        # Firebase Admin Token Verification
        try:
            import firebase_admin
            from firebase_admin import auth as firebase_auth

            decoded_token = firebase_auth.verify_id_token(id_token)
            uid = decoded_token.get('uid')

            try:
                profile = UserProfile.objects.select_related('facility', 'user').get(firebase_uid=uid, is_active=True)
                return (profile.user, None)
            except UserProfile.DoesNotExist:
                raise exceptions.AuthenticationFailed('User profile not mapped in BloodChain database.')

        except Exception as e:
            raise exceptions.AuthenticationFailed(f'Invalid Firebase Token: {str(e)}')

    def _handle_dev_token(self, token):
        token_map = {
            'dev-token-hosp-001': {
                'username': 'hosp_tn_001_admin',
                'name': 'Dr. Arunkumar (Hospital Admin)',
                'role': 'HOSPITAL',
                'facility_id': 'HOSP_TN_001'
            },
            'dev-token-hosp-001-appr': {
                'username': 'hosp_tn_001_appr',
                'name': 'Dr. Ramanathan (Approval Desk)',
                'role': 'HOSPITAL_APPROVAL',
                'facility_id': 'HOSP_TN_001'
            },
            'dev-token-hosp-001-log': {
                'username': 'hosp_tn_001_log',
                'name': 'Officer Karthik (Logistics Officer)',
                'role': 'HOSPITAL_LOGISTICS',
                'facility_id': 'HOSP_TN_001'
            },
            'dev-token-hosp-002': {
                'username': 'hosp_tn_002_admin',
                'name': 'Dr. Sundaram (Hospital Admin)',
                'role': 'HOSPITAL',
                'facility_id': 'HOSP_TN_002'
            },
            'dev-token-hosp-002-appr': {
                'username': 'hosp_tn_002_appr',
                'name': 'Dr. Kavitha (Approval Desk)',
                'role': 'HOSPITAL_APPROVAL',
                'facility_id': 'HOSP_TN_002'
            },
            'dev-token-hosp-002-log': {
                'username': 'hosp_tn_002_log',
                'name': 'Officer Vijay (Logistics Officer)',
                'role': 'HOSPITAL_LOGISTICS',
                'facility_id': 'HOSP_TN_002'
            },
            'dev-token-bb-001': {
                'username': 'bb_tn_001_user',
                'name': 'Officer Meenakshi (Rotary Centre)',
                'role': 'BLOOD_BANK',
                'facility_id': 'BB_TN_001'
            },
            'dev-token-bb-002': {
                'username': 'bb_tn_002_user',
                'name': 'Officer Selvam (Red Cross Chennai)',
                'role': 'BLOOD_BANK',
                'facility_id': 'BB_TN_002'
            }
        }

        info = token_map.get(token)
        if not info:
            raise exceptions.AuthenticationFailed('Invalid dev authentication token')

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
