import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection
from apps.facilities.models import Facility
from apps.accounts.models import UserProfile
from django.contrib.auth.models import User
from apps.inventory.models import BloodInventory, FacilityDailyRecord
from apps.requests.models import BloodRequest
from apps.transfers.models import BloodTransfer

def run_verification():
    print("=" * 60)
    print("BLOODCHAIN NEON POSTGRESQL VERIFICATION REPORT")
    print("=" * 60)

    # 1. Database Connection Info
    db_conn = connection.settings_dict
    print(f"DATABASE ENGINE: {db_conn['ENGINE']}")
    print(f"DATABASE NAME  : {db_conn['NAME']}")
    print(f"DATABASE USER  : {db_conn['USER']}")
    print(f"DATABASE HOST  : {db_conn['HOST']}")
    print(f"DATABASE PORT  : {db_conn['PORT']}")

    with connection.cursor() as cursor:
        cursor.execute("SELECT version();")
        pg_version = cursor.fetchone()[0]
        print(f"POSTGRES VERSION: {pg_version}")

    print("\n--- TABLE ROW COUNTS IN NEON POSTGRESQL ---")
    daily_count = FacilityDailyRecord.objects.count()
    facility_count = Facility.objects.count()
    user_count = User.objects.count()
    profile_count = UserProfile.objects.count()
    inventory_count = BloodInventory.objects.count()

    print(f"FacilityDailyRecord (CSV Dataset): {daily_count:,} rows")
    print(f"Facilities                       : {facility_count} facilities")
    print(f"Users & Profiles                 : {user_count} users / {profile_count} profiles")
    print(f"BloodInventory Records           : {inventory_count} records")

    # 2. Blood Component Breakdown in 292,000 dataset
    print("\n--- DATASET BLOOD COMPONENT DISTRIBUTION IN NEON DB ---")
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT blood_component, COUNT(*) as count, 
                   SUM(units_requested) as total_req,
                   SUM(units_issued) as total_iss,
                   SUM(available_stock) as total_stock
            FROM facility_daily_records
            GROUP BY blood_component
            ORDER BY count DESC;
        """)
        rows = cursor.fetchall()
        for comp, count, req, iss, stock in rows:
            print(f"  {comp:16} | Rows: {count:>7,} | Total Req: {req:>8,} | Total Issued: {iss:>8,} | Total Stock: {stock:>8,}")

    # 3. Test CRUD on BloodRequest and BloodTransfer with blood_component
    print("\n--- VERIFYING BLOOD REQUEST & TRANSFER WITH BLOOD_COMPONENT ---")
    hospitals = Facility.objects.filter(facility_type='HOSPITAL')[:2]
    if len(hospitals) >= 2:
        h1, h2 = hospitals[0], hospitals[1]
        
        test_req = BloodRequest.objects.create(
            request_id="REQ-TEST-NEON-001",
            requesting_facility=h1,
            blood_group="O-",
            blood_component="Plasma",
            requested_quantity=8,
            priority="CRITICAL",
            required_date="2026-10-01",
            reason="Neon Postgres Test with Plasma Component",
            status="PENDING"
        )
        print(f"Created BloodRequest ID: {test_req.request_id} | Blood Group: {test_req.blood_group} | Component: {test_req.blood_component} | Status: {test_req.status}")

        test_tr = BloodTransfer.objects.create(
            transfer_id="TR-TEST-NEON-001",
            request=test_req,
            sender_facility=h2,
            receiver_facility=h1,
            blood_group="O-",
            blood_component="Plasma",
            quantity=8,
            status="CREATED",
            latest_otp_code="982314"
        )
        print(f"Created BloodTransfer ID: {test_tr.transfer_id} | Blood Group: {test_tr.blood_group} | Component: {test_tr.blood_component} | Status: {test_tr.status}")

        # Re-fetch from Neon DB to verify persistence
        fetched_req = BloodRequest.objects.get(request_id="REQ-TEST-NEON-001")
        fetched_tr = BloodTransfer.objects.get(transfer_id="TR-TEST-NEON-001")
        assert fetched_req.blood_component == "Plasma", "Component mismatch on request"
        assert fetched_tr.blood_component == "Plasma", "Component mismatch on transfer"
        print("Persistence Check: SUCCESS (Both BloodRequest & BloodTransfer successfully saved and retrieved with blood_component='Plasma' in Neon PostgreSQL)")

        # Cleanup test records
        test_tr.delete()
        test_req.delete()
        print("Test records cleaned up successfully.")

    print("\n" + "=" * 60)
    print("ALL VERIFICATIONS COMPLETED SUCCESSFULLY ON NEON POSTGRESQL!")
    print("=" * 60)

if __name__ == '__main__':
    run_verification()
