"""
Data loader module for BloodChain ML subsystem.
Extracts operational time-series data from PostgreSQL FacilityDailyRecord.
"""
import os
import pandas as pd
import django

def _ensure_django_setup():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    if not django.conf.settings.configured:
        django.setup()

def load_facility_data(facility_id=None, start_date=None, end_date=None):
    """
    Loads historical operational records from Neon PostgreSQL database.
    Optionally filters by facility_id and date boundaries.
    Returns a pandas DataFrame.
    """
    _ensure_django_setup()
    from apps.inventory.models import FacilityDailyRecord

    qs = FacilityDailyRecord.objects.all()

    if facility_id:
        qs = qs.filter(facility_id=facility_id)
    if start_date:
        qs = qs.filter(date__gte=start_date)
    if end_date:
        qs = qs.filter(date__lte=end_date)

    qs = qs.values(
        'facility_id', 'facility_name', 'facility_type', 'district',
        'date', 'blood_group', 'blood_component',
        'units_requested', 'units_issued', 'units_received',
        'units_transferred_out', 'units_expired', 'available_stock'
    )

    df = pd.DataFrame.from_records(qs)
    if len(df) == 0:
        return df

    df['date'] = pd.to_datetime(df['date'])
    return df

def load_single_series(facility_id, blood_group, blood_component):
    """
    Loads time-series data for a single (facility, blood_group, blood_component) series.
    """
    _ensure_django_setup()
    from apps.inventory.models import FacilityDailyRecord

    qs = FacilityDailyRecord.objects.filter(
        facility_id=facility_id,
        blood_group=blood_group,
        blood_component=blood_component
    ).order_by('date').values(
        'date', 'units_requested', 'units_issued', 'units_received',
        'units_transferred_out', 'units_expired', 'available_stock'
    )

    df = pd.DataFrame.from_records(qs)
    if len(df) > 0:
        df['date'] = pd.to_datetime(df['date'])
    return df
