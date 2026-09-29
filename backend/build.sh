#!/usr/bin/env bash
# ===================================================
# Render.com Build Script for BloodChain Backend
# ===================================================
set -o errexit

echo "=== [Render Build] 1. Upgrading pip & installing dependencies ==="
python -m pip install --upgrade pip
pip install -r requirements.txt

echo "=== [Render Build] 2. Collecting static files ==="
python manage.py collectstatic --no-input

echo "=== [Render Build] 3. Applying database migrations ==="
python manage.py migrate --no-input

echo "=== [Render Build] 4. Initializing seed data if database is fresh ==="
python -c "
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from apps.facilities.models import Facility

if not Facility.objects.exists():
    print('[Render Seed] Fresh database detected! Initializing facilities and credentials...')
    try:
        from scripts.seed_neon_db import seed
        seed()
        print('[Render Seed] Facility accounts initialized.')
    except Exception as e:
        print(f'[Render Seed] Warning during facility seed: {e}')

    try:
        from scripts.seed_donor_data import seed_donors_and_camps
        seed_donors_and_camps()
        print('[Render Seed] Donors, camps, and verification passes initialized.')
    except Exception as e:
        print(f'[Render Seed] Warning during donor seed: {e}')
else:
    print(f'[Render Seed] Database already contains {Facility.objects.count()} facilities. Skipping seed.')
"

echo "=== [Render Build] Build completed successfully ==="
