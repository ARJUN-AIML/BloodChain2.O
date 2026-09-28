import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone

from apps.facilities.models import Facility
from apps.accounts.models import UserProfile
from apps.inventory.models import BloodInventory, BloodBatch
from apps.audit.models import AuditLog

class Command(BaseCommand):
    help = 'Seed Tamil Nadu facilities, isolated inventory, test users, and simulation data'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Seeding BloodChain Tamil Nadu Facilities & Test Accounts..."))

        facilities_data = [
            # Hospitals - Madurai Region
            {
                'facility_id': 'HOSP_TN_001',
                'name': 'Government Rajaji Hospital, Madurai',
                'facility_type': 'HOSPITAL',
                'district': 'Madurai',
                'address': 'Panagal Road, Shenoy Nagar, Madurai, Tamil Nadu 625020'
            },
            {
                'facility_id': 'HOSP_TN_002',
                'name': 'Apollo Specialty Hospital, Madurai',
                'facility_type': 'HOSPITAL',
                'district': 'Madurai',
                'address': 'Lake View Road, K.K. Nagar, Madurai, Tamil Nadu 625020'
            },
            # Blood Banks - Madurai & Chennai
            {
                'facility_id': 'BB_TN_001',
                'name': 'Rotary Central Blood Bank, Madurai',
                'facility_type': 'BLOOD_BANK',
                'district': 'Madurai',
                'address': '7th East Main Road, KK Nagar, Madurai, Tamil Nadu 625020'
            },
            {
                'facility_id': 'BB_TN_002',
                'name': 'Indian Red Cross Society Blood Bank, Chennai',
                'facility_type': 'BLOOD_BANK',
                'district': 'Chennai',
                'address': '50, Red Cross Road, Egmore, Chennai, Tamil Nadu 600008'
            }
        ]

        facility_objs = {}
        for f_data in facilities_data:
            fac, created = Facility.objects.update_or_create(
                facility_id=f_data['facility_id'],
                defaults=f_data
            )
            facility_objs[fac.facility_id] = fac
            status_str = "Created" if created else "Updated"
            self.stdout.write(f"  [{status_str}] Facility: {fac.name} ({fac.facility_id})")

        # Create Test Users & Accounts
        test_accounts = [
            # Hospital A (Rajaji Madurai)
            {
                'username': 'hosp_tn_001_admin',
                'email': 'hospitalA@test.bloodchain',
                'name': 'Dr. Arunkumar (Hospital Admin)',
                'role': 'HOSPITAL',
                'facility_id': 'HOSP_TN_001',
                'token': 'dev-token-hosp-001'
            },
            {
                'username': 'hosp_tn_001_appr',
                'email': 'hospitalA_approval@test.bloodchain',
                'name': 'Dr. Ramanathan (Approval Desk)',
                'role': 'HOSPITAL_APPROVAL',
                'facility_id': 'HOSP_TN_001',
                'token': 'dev-token-hosp-001-appr'
            },
            {
                'username': 'hosp_tn_001_log',
                'email': 'hospitalA_logistics@test.bloodchain',
                'name': 'Officer Karthik (Logistics Officer)',
                'role': 'HOSPITAL_LOGISTICS',
                'facility_id': 'HOSP_TN_001',
                'token': 'dev-token-hosp-001-log'
            },
            # Hospital B (Apollo Madurai)
            {
                'username': 'hosp_tn_002_admin',
                'email': 'hospitalB@test.bloodchain',
                'name': 'Dr. Sundaram (Hospital Admin)',
                'role': 'HOSPITAL',
                'facility_id': 'HOSP_TN_002',
                'token': 'dev-token-hosp-002'
            },
            {
                'username': 'hosp_tn_002_appr',
                'email': 'hospitalB_approval@test.bloodchain',
                'name': 'Dr. Kavitha (Approval Desk)',
                'role': 'HOSPITAL_APPROVAL',
                'facility_id': 'HOSP_TN_002',
                'token': 'dev-token-hosp-002-appr'
            },
            {
                'username': 'hosp_tn_002_log',
                'email': 'hospitalB_logistics@test.bloodchain',
                'name': 'Officer Vijay (Logistics Officer)',
                'role': 'HOSPITAL_LOGISTICS',
                'facility_id': 'HOSP_TN_002',
                'token': 'dev-token-hosp-002-log'
            },
            # Blood Banks
            {
                'username': 'bb_tn_001_user',
                'email': 'bloodbankA@test.bloodchain',
                'name': 'Officer Meenakshi (Rotary Centre)',
                'role': 'BLOOD_BANK',
                'facility_id': 'BB_TN_001',
                'token': 'dev-token-bb-001'
            },
            {
                'username': 'bb_tn_002_user',
                'email': 'bloodbankB@test.bloodchain',
                'name': 'Officer Selvam (Red Cross Chennai)',
                'role': 'BLOOD_BANK',
                'facility_id': 'BB_TN_002',
                'token': 'dev-token-bb-002'
            }
        ]

        for acc in test_accounts:
            user, _ = User.objects.get_or_create(username=acc['username'], defaults={'email': acc['email']})
            fac = facility_objs[acc['facility_id']]
            
            # Remove any conflicting existing user profile with same token if belonging to different user
            UserProfile.objects.filter(firebase_uid=acc['token']).exclude(user=user).delete()

            UserProfile.objects.update_or_create(
                user=user,
                defaults={
                    'firebase_uid': acc['token'],
                    'name': acc['name'],
                    'role': acc['role'],
                    'facility': fac,
                    'is_active': True
                }
            )
            self.stdout.write(f"  [Mapped User] {acc['name']} ({acc['role']}) -> {fac.facility_id}")

        # Seed Stock & Batches for each facility
        blood_groups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
        
        for fac_id, fac in facility_objs.items():
            for bg in blood_groups:
                avail = random.randint(10, 45) if fac.facility_type == 'BLOOD_BANK' else random.randint(5, 25)
                
                inv, _ = BloodInventory.objects.update_or_create(
                    facility=fac,
                    blood_group=bg,
                    defaults={
                        'available_units': avail,
                        'reserved_units': 0,
                        'in_transit_units': 0,
                        'expired_units': 0
                    }
                )

                # Seed sample batches
                now = timezone.now().date()
                BloodBatch.objects.get_or_create(
                    batch_id=f"BATCH-{fac_id}-{bg.replace('+', 'POS').replace('-', 'NEG')}-01",
                    facility=fac,
                    defaults={
                        'blood_group': bg,
                        'quantity': avail,
                        'collection_date': now - timedelta(days=10),
                        'expiry_date': now + timedelta(days=25),
                        'status': 'AVAILABLE'
                    }
                )

        self.stdout.write(self.style.SUCCESS("Successfully seeded Tamil Nadu Facilities & Isolated Workspaces!"))
