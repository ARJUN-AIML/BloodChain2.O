from datetime import date, timedelta
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

from apps.facilities.models import Facility
from apps.accounts.models import UserProfile
from apps.requests.models import BloodRequest, RequestAllocation

class RequestWorkflowTests(TestCase):
    def setUp(self):
        # 1. Create Facilities
        self.hosp_a = Facility.objects.create(
            facility_id='HOSP_TN_001', name='Hospital A', facility_type='HOSPITAL', district='Madurai'
        )
        self.hosp_b = Facility.objects.create(
            facility_id='HOSP_TN_002', name='Hospital B', facility_type='HOSPITAL', district='Madurai'
        )
        self.bb_a = Facility.objects.create(
            facility_id='BB_TN_001', name='Blood Bank A', facility_type='BLOOD_BANK', district='Madurai'
        )

        # 2. Create Users & Profiles
        self.u_hosp_a = User.objects.create_user('user_hosp_a', 'hospa@test.com', 'pass')
        self.p_hosp_a = UserProfile.objects.create(
            user=self.u_hosp_a, firebase_uid='dev-token-hosp-001', name='Hosp A User',
            role='HOSPITAL', facility=self.hosp_a
        )

        self.u_hosp_b = User.objects.create_user('user_hosp_b', 'hospb@test.com', 'pass')
        self.p_hosp_b = UserProfile.objects.create(
            user=self.u_hosp_b, firebase_uid='dev-token-hosp-002', name='Hosp B User',
            role='HOSPITAL', facility=self.hosp_b
        )

        self.u_bb_a = User.objects.create_user('user_bb_a', 'bba@test.com', 'pass')
        self.p_bb_a = UserProfile.objects.create(
            user=self.u_bb_a, firebase_uid='dev-token-bb-001', name='BB A User',
            role='BLOOD_BANK', facility=self.bb_a
        )

        self.client_hosp_a = APIClient()
        self.client_hosp_a.credentials(HTTP_AUTHORIZATION='Bearer dev-token-hosp-001')

        self.client_hosp_b = APIClient()
        self.client_hosp_b.credentials(HTTP_AUTHORIZATION='Bearer dev-token-hosp-002')

        self.client_bb_a = APIClient()
        self.client_bb_a.credentials(HTTP_AUTHORIZATION='Bearer dev-token-bb-001')

    def test_hospital_can_create_request(self):
        payload = {
            'blood_group': 'O+',
            'requested_quantity': 10,
            'required_date': str(date.today() + timedelta(days=2)),
            'priority': 'HIGH',
            'reason': 'Surgery'
        }
        res = self.client_hosp_a.post('/api/requests/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(BloodRequest.objects.count(), 1)
        req = BloodRequest.objects.first()
        self.assertEqual(req.requesting_facility, self.hosp_a)

    def test_blood_bank_cannot_create_request(self):
        """CRITICAL RESTRICTION: Blood Bank MUST NOT be able to request blood."""
        payload = {
            'blood_group': 'O+',
            'requested_quantity': 10,
            'required_date': str(date.today() + timedelta(days=2)),
            'priority': 'HIGH'
        }
        res = self.client_bb_a.post('/api/requests/', payload, format='json')
        self.assertIn(res.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST])
        self.assertEqual(BloodRequest.objects.count(), 0)

    def test_data_isolation_requests_sent(self):
        req = BloodRequest.objects.create(
            request_id='REQ-TEST-1',
            requesting_facility=self.hosp_a,
            blood_group='O+',
            requested_quantity=10,
            required_date=date.today()
        )

        # Hosp A sees it in sent requests
        res_a = self.client_hosp_a.get('/api/requests/sent/')
        self.assertEqual(res_a.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_a.data), 1)

        # Hosp B does NOT see Hosp A's request in sent requests
        res_b = self.client_hosp_b.get('/api/requests/sent/')
        self.assertEqual(res_b.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_b.data), 0)
