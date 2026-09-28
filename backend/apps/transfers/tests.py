import uuid
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from apps.facilities.models import Facility
from apps.accounts.models import UserProfile
from apps.inventory.models import BloodInventory
from apps.requests.models import BloodRequest, RequestAllocation
from apps.transfers.models import BloodTransfer

class WorkspacePermissionAndTransferTests(TestCase):
    def setUp(self):
        # Create Facilities
        self.hosp_a = Facility.objects.create(
            facility_id='HOSP_TN_001',
            name='Government Rajaji Hospital, Madurai',
            facility_type='HOSPITAL',
            district='Madurai'
        )
        self.hosp_b = Facility.objects.create(
            facility_id='HOSP_TN_002',
            name='Apollo Specialty Hospital, Madurai',
            facility_type='HOSPITAL',
            district='Madurai'
        )

        # Users for Hosp A
        self.user_a_appr = User.objects.create_user(username='hosp_a_appr')
        self.profile_a_appr = UserProfile.objects.create(
            user=self.user_a_appr,
            firebase_uid='dev-token-hosp-001-appr',
            name='Dr. Ramanathan (Approval)',
            role='HOSPITAL_APPROVAL',
            facility=self.hosp_a
        )

        self.user_a_log = User.objects.create_user(username='hosp_a_log')
        self.profile_a_log = UserProfile.objects.create(
            user=self.user_a_log,
            firebase_uid='dev-token-hosp-001-log',
            name='Officer Karthik (Logistics)',
            role='HOSPITAL_LOGISTICS',
            facility=self.hosp_a
        )

        # Users for Hosp B
        self.user_b_appr = User.objects.create_user(username='hosp_b_appr')
        self.profile_b_appr = UserProfile.objects.create(
            user=self.user_b_appr,
            firebase_uid='dev-token-hosp-002-appr',
            name='Dr. Kavitha (Approval)',
            role='HOSPITAL_APPROVAL',
            facility=self.hosp_b
        )

        self.user_b_log = User.objects.create_user(username='hosp_b_log')
        self.profile_b_log = UserProfile.objects.create(
            user=self.user_b_log,
            firebase_uid='dev-token-hosp-002-log',
            name='Officer Vijay (Logistics)',
            role='HOSPITAL_LOGISTICS',
            facility=self.hosp_b
        )

        # Initial Inventory for Hosp B (Sender)
        BloodInventory.objects.create(
            facility=self.hosp_b,
            blood_group='O+',
            available_units=20,
            reserved_units=0,
            in_transit_units=0
        )

        # Initial Inventory for Hosp A (Receiver)
        BloodInventory.objects.create(
            facility=self.hosp_a,
            blood_group='O+',
            available_units=5,
            reserved_units=0,
            in_transit_units=0
        )

    def test_complete_approval_desk_to_logistics_handoff_workflow(self):
        # 1. Hosp A Approval Desk creates blood request
        client_a_appr = APIClient()
        client_a_appr.credentials(HTTP_AUTHORIZATION='Bearer dev-token-hosp-001-appr')
        res1 = client_a_appr.post('/api/requests/', {
            'blood_group': 'O+',
            'requested_quantity': 10,
            'priority': 'HIGH'
        })
        self.assertEqual(res1.status_code, 201)
        req_id = res1.data['id']

        # 2. Hosp B Approval Desk accepts request (10 units)
        client_b_appr = APIClient()
        client_b_appr.credentials(HTTP_AUTHORIZATION='Bearer dev-token-hosp-002-appr')
        res2 = client_b_appr.post(f'/api/requests/{req_id}/respond/', {'offered_quantity': 10})
        self.assertEqual(res2.status_code, 201)
        transfer_id_str = res2.data['transfer_id']

        transfer = BloodTransfer.objects.get(transfer_id=transfer_id_str)

        # 3. Logistics User tries to approve transfer -> DENIED (403)
        client_b_log = APIClient()
        client_b_log.credentials(HTTP_AUTHORIZATION='Bearer dev-token-hosp-002-log')
        res_fail_appr = client_b_log.post(f'/api/transfers/{transfer.id}/approve/')
        self.assertEqual(res_fail_appr.status_code, 403)

        # 4. Hosp B Approval Desk authorizes transfer
        res3 = client_b_appr.post(f'/api/transfers/{transfer.id}/approve/')
        self.assertEqual(res3.status_code, 200)

        # Stock check at Hosp B: Available=10, Reserved=10
        inv_b = BloodInventory.objects.get(facility=self.hosp_b, blood_group='O+')
        self.assertEqual(inv_b.available_units, 10)
        self.assertEqual(inv_b.reserved_units, 10)

        # 5. Hosp B Approval Desk tries to dispatch -> DENIED (403)
        res_fail_dispatch = client_b_appr.post(f'/api/transfers/{transfer.id}/dispatch/')
        self.assertEqual(res_fail_dispatch.status_code, 403)

        # 6. Hosp B Logistics dispatches shipment
        res4 = client_b_log.post(f'/api/transfers/{transfer.id}/dispatch/')
        self.assertEqual(res4.status_code, 200)

        # Stock check at Hosp B: Reserved=0, In-Transit=10
        inv_b.refresh_from_db()
        self.assertEqual(inv_b.reserved_units, 0)
        self.assertEqual(inv_b.in_transit_units, 10)

        # 7. Hosp A Logistics generates 6-digit OTP code (Receiver)
        client_a_log = APIClient()
        client_a_log.credentials(HTTP_AUTHORIZATION='Bearer dev-token-hosp-001-log')
        res5 = client_a_log.post(f'/api/transfers/{transfer.id}/generate-otp/')
        self.assertEqual(res5.status_code, 200)
        otp_code = res5.data['otp_code']

        # 8. Hosp B Logistics verifies OTP code (Sender)
        res6 = client_b_log.post(f'/api/transfers/{transfer.id}/verify-otp/', {'otp_code': otp_code})
        self.assertEqual(res6.status_code, 200)

        # Final Inventory Verification
        inv_b.refresh_from_db()
        inv_a = BloodInventory.objects.get(facility=self.hosp_a, blood_group='O+')
        self.assertEqual(inv_b.in_transit_units, 0)
        self.assertEqual(inv_a.available_units, 15)  # Started at 5 + 10 = 15
