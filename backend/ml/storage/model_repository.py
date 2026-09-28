"""
Model repository module for BloodChain ML subsystem.
Handles model persistence, versioning, and metadata storage in PostgreSQL.
"""
import os
import json
import joblib
from datetime import datetime, date
import django

def _ensure_django_setup():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    if not django.conf.settings.configured:
        django.setup()

from ml.config.ml_config import MODEL_DIR

def generate_model_version(facility_id=None):
    """Generates an immutable model version tag with facility and timestamp."""
    fac_tag = f"_{facility_id}" if facility_id else "_all"
    return f"xgb_facility_v1{fac_tag}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

def save_model_artifact(model, model_version, series_key):
    """
    Saves a trained model artifact to disk.
    File name: {model_version}_{facility}_{group}_{component}.joblib
    """
    fid, bg, comp = series_key
    clean_bg = bg.replace('+', 'pos').replace('-', 'neg')
    clean_comp = comp.replace(' ', '_')
    filename = f"{model_version}_{fid}_{clean_bg}_{clean_comp}.joblib"
    filepath = os.path.join(MODEL_DIR, filename)
    try:
        joblib.dump(model, filepath)
        return filepath
    except Exception as e:
        return None

def save_model_metadata(
    model_version,
    data_range,
    total_series,
    total_predictions,
    xgb_metrics,
    baseline_metrics,
    sufficient_count,
    insufficient_count,
    warnings,
    config
):
    """
    Persists training run metadata to PostgreSQL model_metadata table.
    """
    _ensure_django_setup()
    from apps.demand.models import ModelMetadata

    metadata, created = ModelMetadata.objects.update_or_create(
        model_version=model_version,
        defaults={
            'training_data_start': data_range.get('start'),
            'training_data_end': data_range.get('end'),
            'total_series_trained': sufficient_count,
            'total_predictions_generated': total_predictions,
            'xgb_mae': xgb_metrics.get('mae'),
            'xgb_rmse': xgb_metrics.get('rmse'),
            'xgb_wape': xgb_metrics.get('wape'),
            'baseline_mae': baseline_metrics.get('mae'),
            'baseline_rmse': baseline_metrics.get('rmse'),
            'baseline_wape': baseline_metrics.get('wape'),
            'facilities_with_sufficient_data': sufficient_count,
            'facilities_insufficient_data': insufficient_count,
            'data_quality_warnings': json.dumps(warnings),
            'config_json': json.dumps(config, default=str),
        }
    )
    return metadata

def get_latest_metadata(model_version=None):
    """
    Fetches model metadata record from PostgreSQL.
    """
    _ensure_django_setup()
    from apps.demand.models import ModelMetadata

    if model_version:
        return ModelMetadata.objects.filter(model_version=model_version).first()
    return ModelMetadata.objects.order_by('-trained_at').first()

def get_all_metadata(limit=10):
    """
    Fetches recent model training history.
    """
    _ensure_django_setup()
    from apps.demand.models import ModelMetadata

    return list(ModelMetadata.objects.all().order_by('-trained_at')[:limit])
