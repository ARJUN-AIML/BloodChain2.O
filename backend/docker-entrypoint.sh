#!/bin/sh
set -e

echo "=== [BloodChain Backend] Starting Container Initialization ==="

# -------------------------------------------------------------
# 1. Wait for PostgreSQL Database readiness (if configured)
# -------------------------------------------------------------
echo "--> Checking database connectivity..."
python - <<'EOF'
import os
import sys
import time

db_url = os.getenv('DATABASE_URL', '')
pg_host = os.getenv('POSTGRES_HOST', '')

# If SQLite is used or no external DB is specified, proceed immediately
if not db_url and not pg_host:
    print("[DB Check] Using local SQLite database engine. Proceeding...")
    sys.exit(0)

if 'sqlite' in db_url.lower():
    print("[DB Check] SQLite database detected. Proceeding...")
    sys.exit(0)

import dj_database_url
import psycopg2

try:
    if db_url:
        db_config = dj_database_url.parse(db_url)
    else:
        db_config = {
            'HOST': pg_host,
            'PORT': os.getenv('POSTGRES_PORT', 5432),
            'USER': os.getenv('POSTGRES_USER', 'bloodchain'),
            'PASSWORD': os.getenv('POSTGRES_PASSWORD', ''),
            'NAME': os.getenv('POSTGRES_DB', 'bloodchain')
        }

    host = db_config.get('HOST') or 'localhost'
    port = int(db_config.get('PORT') or 5432)
    user = db_config.get('USER') or 'bloodchain'
    password = db_config.get('PASSWORD') or ''
    dbname = db_config.get('NAME') or 'bloodchain'

    max_attempts = 30
    for attempt in range(1, max_attempts + 1):
        try:
            conn = psycopg2.connect(
                host=host,
                port=port,
                user=user,
                password=password,
                dbname=dbname,
                connect_timeout=3
            )
            conn.close()
            print(f"[DB Check] Database connection successful ({host}:{port}/{dbname})!")
            sys.exit(0)
        except Exception as err:
            print(f"[DB Check] Waiting for database at {host}:{port}... (Attempt {attempt}/{max_attempts}) - {err}")
            time.sleep(2)

    print("[DB Check] Database connection timed out after 60s.")
    sys.exit(1)
except Exception as e:
    print(f"[DB Check] Database check encountered: {e}. Attempting to continue...")
    sys.exit(0)
EOF

# -------------------------------------------------------------
# 2. Run Database Migrations
# -------------------------------------------------------------
echo "--> Applying database migrations..."
python manage.py migrate --noinput

# -------------------------------------------------------------
# 3. Seed Initial Facilities & Donor Data (Idempotent / Non-destructive)
# -------------------------------------------------------------
echo "--> Verifying database records..."
python - <<'EOF'
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.facilities.models import Facility

if not Facility.objects.exists():
    print("[Seed] Fresh database detected! Seeding facilities and initial inventory...")
    try:
        from scripts.seed_neon_db import seed
        seed()
        print("[Seed] Successfully seeded facilities and credentials.")
    except Exception as e:
        print(f"[Seed] Warning during facility seeding: {e}")

    try:
        from scripts.seed_donor_data import seed_donors_and_camps
        seed_donors_and_camps()
        print("[Seed] Successfully seeded donors, camps, passes, and certificates.")
    except Exception as e:
        print(f"[Seed] Warning during donor data seeding: {e}")
else:
    print(f"[Seed] Database already initialized ({Facility.objects.count()} facilities present). Skipping seed.")
EOF

# -------------------------------------------------------------
# 4. Collect Static Files
# -------------------------------------------------------------
echo "--> Collecting static assets..."
python manage.py collectstatic --noinput --clear || echo "Static collection completed or skipped."

echo "=== [BloodChain Backend] Initialization Complete. Launching Service ==="
exec "$@"
