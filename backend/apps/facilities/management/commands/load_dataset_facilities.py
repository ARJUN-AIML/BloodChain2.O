import os
import csv
import json
import random
from datetime import datetime, timedelta
from collections import defaultdict
from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth.models import User

from apps.facilities.models import Facility
from apps.inventory.models import BloodInventory, BloodBatch, BLOOD_GROUPS
from apps.accounts.models import UserProfile
from apps.requests.models import BloodRequest, RequestAllocation
from apps.transfers.models import BloodTransfer

class Command(BaseCommand):
    help = 'Load real facilities, inventory balances, and historical demand statistics from dataset CSV'

    def handle(self, *args, **options):
        csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))), 'dataset', 'bloodchain_all_facilities_area_based_ids.csv')
        
        if not os.path.exists(csv_path):
            self.stderr.write(f"Dataset file not found at: {csv_path}")
            return

        self.stdout.write(self.style.SUCCESS(f"Reading dataset: {csv_path}..."))

        facilities_dict = {}
        latest_stock = {}  # (facility_id, blood_group) -> latest available stock
        historical_stats = defaultdict(lambda: {'total_requested': 0, 'days': 0, 'total_issued': 0, 'max_requested': 0})
        total_rows = 0

        with open(csv_path, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)
            for row in reader:
                total_rows += 1
                fid = row['facility_id'].strip()
                fname = row['facility_name'].strip()
                ftype_raw = row['facility_type'].strip().lower()
                ftype = 'HOSPITAL' if ftype_raw == 'hospital' else 'BLOOD_BANK'
                district = row['district'].strip()

                if fid not in facilities_dict:
                    facilities_dict[fid] = {
                        'facility_id': fid,
                        'name': fname,
                        'facility_type': ftype,
                        'district': district,
                        'address': f"{fname}, {district}, Tamil Nadu",
                        'is_active': True
                    }

                bg = row['blood_group'].strip()
                stock = int(row['available_stock']) if row['available_stock'] else 0
                latest_stock[(fid, bg)] = stock

                req = int(row['units_requested']) if row['units_requested'] else 0
                issued = int(row['units_issued']) if row['units_issued'] else 0

                stat = historical_stats[(fid, bg)]
                stat['total_requested'] += req
                stat['total_issued'] += issued
                stat['max_requested'] = max(stat['max_requested'], req)
                stat['days'] += 1

        self.stdout.write(f"Processed {total_rows} rows from dataset.")
        self.stdout.write(f"Found {len(facilities_dict)} unique facilities and {len(latest_stock)} stock records.")

        with transaction.atomic():
            # 1. Insert / Update all 50 real facilities
            facility_objs = {}
            for fid, f_data in facilities_dict.items():
                fac, created = Facility.objects.update_or_create(
                    facility_id=fid,
                    defaults=f_data
                )
                facility_objs[fid] = fac

            self.stdout.write(self.style.SUCCESS(f"Saved {len(facility_objs)} facilities to database."))

            # 2. Reassign any existing demo requests and transfers to real dataset facilities
            ch_h_01 = facility_objs.get('ch_h_01')
            ch_h_05 = facility_objs.get('ch_h_05') or facility_objs.get('ma_h_01')
            ch_b_01 = facility_objs.get('ch_b_01')

            if ch_h_01 and ch_h_05:
                BloodRequest.objects.filter(requesting_facility_id__in=['HOSP_TN_001', 'HOSP_TN_002', 'BB_TN_001', 'BB_TN_002']).update(requesting_facility=ch_h_01)
                RequestAllocation.objects.filter(responding_facility_id__in=['HOSP_TN_001', 'HOSP_TN_002', 'BB_TN_001', 'BB_TN_002']).update(responding_facility=ch_h_05)
                BloodTransfer.objects.filter(sender_facility_id__in=['HOSP_TN_001', 'HOSP_TN_002', 'BB_TN_001', 'BB_TN_002']).update(sender_facility=ch_h_05)
                BloodTransfer.objects.filter(receiver_facility_id__in=['HOSP_TN_001', 'HOSP_TN_002', 'BB_TN_001', 'BB_TN_002']).update(receiver_facility=ch_h_01)

            # 3. Update UserProfiles to real facilities
            UserProfile.objects.filter(facility_id='HOSP_TN_001').update(facility=ch_h_01)
            UserProfile.objects.filter(facility_id='HOSP_TN_002').update(facility=ch_h_05)
            UserProfile.objects.filter(facility_id__in=['BB_TN_001', 'BB_TN_002']).update(facility=ch_b_01)

            # Ensure Firebase users are bound to real facilities
            UserProfile.objects.filter(firebase_uid='nqPwraGh53UHFlICLkMeTQhTHeh2').update(
                facility=ch_h_01,
                name="Dr. Arunkumar (Rajiv Gandhi Govt General Hospital)"
            )
            UserProfile.objects.filter(firebase_uid='MHrxbyyHkeXICN40YqzUJAjgQXA2').update(
                facility=ch_h_05,
                name="Dr. Sundaram (Apollo Hospitals, Greams Road)"
            )
            UserProfile.objects.filter(firebase_uid='BwkPRMv3ZtgpwzA2342G015PFaN2').update(
                facility=ch_b_01,
                name="Officer Meenakshi (Indian Voluntary Blood Bank)"
            )

            # 4. Remove old fake facilities
            Facility.objects.filter(facility_id__in=['HOSP_TN_001', 'HOSP_TN_002', 'BB_TN_001', 'BB_TN_002']).delete()

            # 5. Populate / Sync BloodInventory for all facilities and blood groups from dataset
            created_inv_count = 0
            updated_inv_count = 0
            today = datetime.now().date()

            # Clear old batches and create realistic batches for current stock
            BloodBatch.objects.all().delete()
            batches_to_create = []

            for (fid, bg), stock_units in latest_stock.items():
                fac = facility_objs.get(fid)
                if not fac:
                    continue

                inv, created = BloodInventory.objects.update_or_create(
                    facility=fac,
                    blood_group=bg,
                    defaults={
                        'available_units': stock_units,
                        'reserved_units': 0,
                        'in_transit_units': 0,
                        'expired_units': 0
                    }
                )
                if created:
                    created_inv_count += 1
                else:
                    updated_inv_count += 1

                # Create sample batch records for batches in inventory
                if stock_units > 0:
                    units_remaining = stock_units
                    batch_num = 1
                    while units_remaining > 0:
                        batch_qty = min(units_remaining, random.choice([5, 10, 15, 20]))
                        units_remaining -= batch_qty
                        
                        # Expiry between 3 days and 35 days
                        days_to_expiry = random.choice([4, 6, 12, 18, 25, 32, 40])
                        expiry_date = today + timedelta(days=days_to_expiry)
                        collection_date = expiry_date - timedelta(days=42)

                        batches_to_create.append(BloodBatch(
                            batch_id=f"BAT-{fid}-{bg.replace('+', 'P').replace('-', 'N')}-{batch_num:03d}",
                            facility=fac,
                            blood_group=bg,
                            quantity=batch_qty,
                            collection_date=collection_date,
                            expiry_date=expiry_date,
                            status='AVAILABLE'
                        ))
                        batch_num += 1

            BloodBatch.objects.bulk_create(batches_to_create, batch_size=500)
            self.stdout.write(f"Synced {created_inv_count + updated_inv_count} BloodInventory rows and created {len(batches_to_create)} BloodBatches.")

            # 6. Save Demand Statistics Cache to dataset folder
            stats_output = {}
            for (fid, bg), st in historical_stats.items():
                if fid not in stats_output:
                    stats_output[fid] = {}
                days = max(1, st['days'])
                avg_daily = st['total_requested'] / days
                stats_output[fid][bg] = {
                    'avg_daily_demand': round(avg_daily, 3),
                    'total_requested_history': st['total_requested'],
                    'total_issued_history': st['total_issued'],
                    'max_single_day_request': st['max_requested'],
                    'days_recorded': days
                }

            stats_file_path = os.path.join(os.path.dirname(csv_path), 'demand_stats.json')
            with open(stats_file_path, 'w', encoding='utf-8') as sf:
                json.dump(stats_output, sf, indent=2)

            self.stdout.write(self.style.SUCCESS(f"Saved dataset demand statistics to: {stats_file_path}"))

        self.stdout.write(self.style.SUCCESS("Successfully loaded all dataset facilities and initialized real inventory!"))
