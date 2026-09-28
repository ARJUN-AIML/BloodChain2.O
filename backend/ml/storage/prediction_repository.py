"""
Prediction repository module for BloodChain ML subsystem.
Manages storage and retrieval of demand predictions in Neon PostgreSQL.
Guarantees append-only persistence: historical predictions are never destroyed.
"""
from datetime import date
from django.db.models import Sum, Avg
import django

def _ensure_django_setup():
    import os
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    if not django.conf.settings.configured:
        django.setup()

def save_predictions_bulk(prediction_objects):
    """
    Persists prediction records to Neon PostgreSQL demand_predictions table.
    """
    _ensure_django_setup()
    from apps.demand.models import DemandPrediction

    if not prediction_objects:
        return 0

    to_create = [
        DemandPrediction(
            facility_id=p['facility_id'],
            facility_type=p.get('facility_type', 'Hospital'),
            forecast_target=p.get('forecast_target', 'units_requested'),
            blood_group=p['blood_group'],
            blood_component=p['blood_component'],
            forecast_date=p['forecast_date'],
            predicted_units=p['predicted_units'],
            model_version=p['model_version'],
        )
        for p in prediction_objects
    ]
    created = DemandPrediction.objects.bulk_create(to_create, batch_size=1000)
    return len(created)

def get_facility_predictions(facility_id, model_version=None, blood_group=None, blood_component=None):
    """
    Retrieves stored predictions for a facility, filtered optionally by group, component, or version.
    """
    _ensure_django_setup()
    from apps.demand.models import DemandPrediction

    qs = DemandPrediction.objects.filter(facility_id=facility_id)

    if not model_version:
        latest = qs.order_by('-generated_at').first()
        model_version = latest.model_version if latest else None

    if model_version:
        qs = qs.filter(model_version=model_version)

    if blood_group:
        qs = qs.filter(blood_group=blood_group)

    if blood_component:
        qs = qs.filter(blood_component=blood_component)

    return qs.order_by('forecast_date')

def get_historical_actuals(facility_id, days=14, blood_group=None, blood_component=None, target_col='units_requested'):
    """
    Retrieves ground-truth actual requisition/outbound and stock records for the line graph.
    Properly filters by blood group and component so the dates and actual values
    belong to the requested clinical series.
    Uses target_col ('units_requested' for hospitals, 'units_transferred_out' for blood banks).
    """
    _ensure_django_setup()
    from apps.inventory.models import FacilityDailyRecord

    base_qs = FacilityDailyRecord.objects.filter(facility_id=facility_id)
    if blood_group and blood_group != 'all':
        base_qs = base_qs.filter(blood_group=blood_group)
    if blood_component and blood_component != 'all':
        base_qs = base_qs.filter(blood_component=blood_component)

    recent_records = (
        base_qs.order_by('-date')
        .values('date')
        .distinct()[:days]
    )
    recent_dates = sorted([r['date'] for r in recent_records])

    history = []
    for d in recent_dates:
        agg = base_qs.filter(date=d).aggregate(
            target_val=Sum(target_col),
            req=Sum('units_requested'),
            trans=Sum('units_transferred_out'),
            issued=Sum('units_issued'),
            stock=Sum('available_stock')
        )
        history.append({
            'date': str(d),
            'day_name': d.strftime('%a'),
            'target_units': agg['target_val'] if agg['target_val'] is not None else 0,
            'units_requested': agg['req'] if agg['req'] is not None else 0,
            'units_transferred_out': agg['trans'] if agg['trans'] is not None else 0,
            'units_issued': agg['issued'] if agg['issued'] is not None else 0,
            'available_stock': agg['stock'] if agg['stock'] is not None else 0,
        })

    return history

def backfill_prediction_actuals():
    """
    Looks up actual units for predictions whose forecast_date has passed.
    Fills actual_units and prediction_error without modifying original predictions.
    """
    _ensure_django_setup()
    from apps.demand.models import DemandPrediction
    from apps.inventory.models import FacilityDailyRecord

    today = date.today()
    pending = DemandPrediction.objects.filter(
        actual_units__isnull=True,
        forecast_date__lt=today
    )

    updated_count = 0
    for pred in pending.iterator(chunk_size=500):
        actual_result = FacilityDailyRecord.objects.filter(
            facility_id=pred.facility_id,
            blood_group=pred.blood_group,
            blood_component=pred.blood_component,
            date=pred.forecast_date
        ).aggregate(total=Sum('units_requested'))

        actual_val = actual_result.get('total')
        if actual_val is not None:
            pred.actual_units = float(actual_val)
            pred.prediction_error = round(float(actual_val) - pred.predicted_units, 3)
            pred.save(update_fields=['actual_units', 'prediction_error'])
            updated_count += 1

    return updated_count
