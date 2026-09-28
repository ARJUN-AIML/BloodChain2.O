import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import django

# Setup django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from apps.facilities.models import Facility
from apps.accounts.models import UserProfile
from apps.inventory.models import BloodInventory, FacilityDailyRecord, BLOOD_GROUPS, BLOOD_COMPONENTS

def seed():
    credentials_file = os.path.join(os.path.dirname(__file__), '..', 'dataset', 'synced_credentials.json')
    if not os.path.exists(credentials_file):
        print(f"File {credentials_file} does not exist.")
        return

    with open(credentials_file, 'r', encoding='utf-8') as f:
        credentials = json.load(f)

    print(f"Loaded {len(credentials)} credentials.")

    # 1. Create Facilities
    facilities_created = 0
    users_created = 0
    for cred in credentials:
        fid = cred['facility_id']
        name = cred['facility_name']
        loc = cred['location']
        role = cred['role']
        facility_type = 'BLOOD_BANK' if role == 'BLOOD_BANK' else 'HOSPITAL'

        facility, f_created = Facility.objects.get_or_create(
            facility_id=fid,
            defaults={
                'name': name,
                'facility_type': facility_type,
                'district': loc,
                'address': f"{name}, {loc}",
                'is_active': True,
            }
        )
        if f_created:
            facilities_created += 1

        email = cred['email']
        username = email.split('@')[0]
        password = cred['password']
        fb_uid = cred.get('firebase_uid') or f"fb_{fid}"

        # Create or update user
        user, u_created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'first_name': name[:30],
                'is_active': True,
            }
        )
        user.set_password(password)
        user.save()

        # Create or update profile
        profile, p_created = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'firebase_uid': fb_uid,
                'name': name,
                'role': role,
                'facility': facility,
                'is_active': True,
            }
        )
        if not p_created:
            profile.firebase_uid = fb_uid
            profile.facility = facility
            profile.role = role
            profile.save()

        users_created += 1

    print(f"Facilities: {Facility.objects.count()} (created {facilities_created})")
    print(f"Users & Profiles: {User.objects.count()} (synced {users_created})")

    # 2. Seed Blood Inventory for all facilities, blood groups, and components
    print("Seeding Blood Inventory from latest daily records...")
    rows = []
    from django.db import connection
    try:
        with connection.cursor() as cursor:
            if connection.vendor == 'postgresql':
                cursor.execute("""
                    SELECT DISTINCT ON (facility_id, blood_group, blood_component)
                        facility_id, blood_group, blood_component, available_stock
                    FROM facility_daily_records
                    ORDER BY facility_id, blood_group, blood_component, date DESC;
                """)
            else:
                cursor.execute("""
                    SELECT facility_id, blood_group, blood_component, available_stock
                    FROM facility_daily_records
                    GROUP BY facility_id, blood_group, blood_component;
                """)
            rows = cursor.fetchall()
            print(f"Fetched {len(rows)} latest stock points from facility_daily_records.")
    except Exception as e:
        print(f"facility_daily_records query note ({e}), using default inventory.")

    inventory_to_create = []
    existing_keys = set(BloodInventory.objects.values_list('facility_id', 'blood_group', 'blood_component'))

    for fid, bg, comp, stock in rows:
        if (fid, bg, comp) not in existing_keys:
            stock_val = max(10, int(stock) if stock is not None else 25)
            inventory_to_create.append(
                BloodInventory(
                    facility_id=fid,
                    blood_group=bg,
                    blood_component=comp,
                    available_units=stock_val,
                    reserved_units=max(0, int(stock_val * 0.1)),
                    in_transit_units=0,
                    expired_units=0
                )
            )

    # Ensure every facility has at least records for all 8 groups and major components
    comp_codes = [c[0] for c in BLOOD_COMPONENTS]
    bg_codes = [b[0] for b in BLOOD_GROUPS]
    all_facilities = list(Facility.objects.all())

    existing_set = existing_keys.union({(i.facility_id, i.blood_group, i.blood_component) for i in inventory_to_create})
    fallback_count = 0
    for fac in all_facilities:
        for bg in bg_codes:
            for comp in comp_codes:
                if (fac.facility_id, bg, comp) not in existing_set:
                    inventory_to_create.append(
                        BloodInventory(
                            facility=fac,
                            blood_group=bg,
                            blood_component=comp,
                            available_units=35,
                            reserved_units=5,
                            in_transit_units=0,
                            expired_units=0
                        )
                    )
                    fallback_count += 1

    if inventory_to_create:
        BloodInventory.objects.bulk_create(inventory_to_create, batch_size=500)
        print(f"Created {len(inventory_to_create)} BloodInventory items (including {fallback_count} baseline records).")

    print(f"Total BloodInventory records in Neon DB: {BloodInventory.objects.count()}")

if __name__ == '__main__':
    seed()
