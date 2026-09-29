"""
Management command to load historical daily facility records from CSV into FacilityDailyRecord.
This seeds the ML forecasting pipeline with real operational time-series data.
Designed for Render deployment: idempotent, chunked bulk-insert, skip-if-populated.
"""
import os
import csv
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.inventory.models import FacilityDailyRecord


class Command(BaseCommand):
    help = 'Load historical daily records from CSV into FacilityDailyRecord table for ML forecasting'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force reload even if records already exist (truncates first)',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=2000,
            help='Batch size for bulk_create (default: 2000)',
        )

    def handle(self, *args, **options):
        force = options['force']
        batch_size = options['batch_size']

        # Check if data already exists
        existing_count = FacilityDailyRecord.objects.count()
        if existing_count > 0 and not force:
            self.stdout.write(
                self.style.SUCCESS(
                    f'FacilityDailyRecord already has {existing_count} records. '
                    f'Skipping CSV import. Use --force to reload.'
                )
            )
            return

        # Locate CSV file
        csv_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(
                os.path.dirname(os.path.dirname(__file__))
            ))),
            'dataset',
            'bloodchain_all_facilities_area_based_ids.csv'
        )

        if not os.path.exists(csv_path):
            self.stderr.write(f'CSV file not found at: {csv_path}')
            return

        self.stdout.write(f'Loading daily records from: {csv_path}')

        if force and existing_count > 0:
            self.stdout.write(f'Force mode: deleting {existing_count} existing records...')
            FacilityDailyRecord.objects.all().delete()

        # Read CSV and bulk-insert in chunks
        total_created = 0
        batch = []

        with open(csv_path, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    record = FacilityDailyRecord(
                        facility_id=row['facility_id'].strip(),
                        facility_name=row['facility_name'].strip(),
                        facility_type=row['facility_type'].strip(),
                        district=row['district'].strip(),
                        date=row['date'].strip(),
                        blood_group=row['blood_group'].strip(),
                        blood_component=row['blood_component'].strip(),
                        units_requested=int(row.get('units_requested', 0) or 0),
                        units_issued=int(row.get('units_issued', 0) or 0),
                        units_received=int(row.get('units_received', 0) or 0),
                        units_transferred_out=int(row.get('units_transferred_out', 0) or 0),
                        units_expired=int(row.get('units_expired', 0) or 0),
                        available_stock=int(row.get('available_stock', 0) or 0),
                    )
                    batch.append(record)
                except (ValueError, KeyError) as e:
                    continue  # Skip malformed rows

                if len(batch) >= batch_size:
                    FacilityDailyRecord.objects.bulk_create(batch, batch_size=batch_size)
                    total_created += len(batch)
                    if total_created % 20000 == 0:
                        self.stdout.write(f'  ... loaded {total_created} records')
                    batch = []

            # Insert remaining records
            if batch:
                FacilityDailyRecord.objects.bulk_create(batch, batch_size=batch_size)
                total_created += len(batch)

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully loaded {total_created} FacilityDailyRecord entries into database.'
            )
        )
