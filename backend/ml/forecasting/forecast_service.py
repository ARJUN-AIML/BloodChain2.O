"""
Forecasting service module for BloodChain ML subsystem.
High-level service interface for running the ML pipeline, training models, and generating forecasts.
Completely decoupled from the frontend/UI.
"""
import logging
import numpy as np
from ml.config.ml_config import (
    DEFAULT_TARGET_COL,
    MIN_HISTORY_DAYS,
    MIN_HISTORY_DAYS_BASELINE,
    FORECAST_HORIZON,
    XGB_PARAMS,
    get_forecast_target
)
from ml.preprocessing.data_loader import load_facility_data
from ml.preprocessing.data_validator import validate_dataset
from ml.forecasting.demand_forecast import forecast_single_series
from ml.storage.model_repository import generate_model_version, save_model_metadata, get_latest_metadata, get_all_metadata
from ml.storage.prediction_repository import save_predictions_bulk, backfill_prediction_actuals

logger = logging.getLogger('bloodchain.ml')

def run_pipeline(facility_id=None, target_col=DEFAULT_TARGET_COL, forecast_start_date=None):
    """
    Executes the end-to-end ML demand forecasting pipeline:
    1. Extracts operational data from PostgreSQL
    2. Validates data quality and continuity
    3. Groups into (facility, blood_group, blood_component) series
    4. Trains XGBoost with chronological holdout and baseline benchmarking
    5. Generates 7-day future predictions
    6. Persists predictions and model metadata in PostgreSQL
    """
    logger.info(f"Starting ML Forecasting Pipeline (facility={facility_id or 'ALL'})...")

    # Step 1: Load Data
    df = load_facility_data(facility_id=facility_id)
    if len(df) == 0:
        return {'status': 'error', 'message': 'No operational records found in database'}

    # Step 2: Validate Data
    quality = validate_dataset(df)
    for w in quality['warnings']:
        logger.warning(f"Data audit: {w}")

    # Step 3: Iterate Series
    model_version = generate_model_version(facility_id=facility_id)
    series_groups = df.groupby(['facility_id', 'blood_group', 'blood_component'])

    total_series = len(series_groups)
    sufficient_count = 0
    insufficient_count = 0
    baseline_count = 0
    xgb_count = 0
    all_xgb_metrics = []
    all_baseline_metrics = []
    predictions_to_save = []

    for (fid, bg, comp), group_df in series_groups:
        series_key = (fid, bg, comp)
        group_ft = group_df['facility_type'].iloc[0] if 'facility_type' in group_df.columns else 'Hospital'
        target_info = get_forecast_target(group_ft)
        effective_target_col = target_col if target_col != DEFAULT_TARGET_COL else target_info['target_field']

        result = forecast_single_series(
            group_df,
            series_key,
            model_version,
            target_col=effective_target_col,
            forecast_start_date=forecast_start_date
        )

        if result['status'] == 'insufficient_data':
            insufficient_count += 1
            continue
        elif result['status'] == 'no_historical_demand':
            sufficient_count += 1
        elif result['status'] == 'baseline_only':
            baseline_count += 1
            sufficient_count += 1
            if result['metrics'].get('baseline') and result['metrics']['baseline'].get('mae') is not None:
                all_baseline_metrics.append(result['metrics']['baseline'])
        elif result['status'] == 'xgboost':
            xgb_count += 1
            sufficient_count += 1
            if result['metrics'].get('xgboost') and result['metrics']['xgboost'].get('mae') is not None:
                all_xgb_metrics.append(result['metrics']['xgboost'])
            if result['metrics'].get('baseline') and result['metrics']['baseline'].get('mae') is not None:
                all_baseline_metrics.append(result['metrics']['baseline'])

        for p in result['predictions']:
            predictions_to_save.append({
                'facility_id': fid,
                'facility_type': group_ft,
                'forecast_target': effective_target_col,
                'blood_group': bg,
                'blood_component': comp,
                'forecast_date': p['forecast_date'],
                'predicted_units': p['predicted_units'],
                'model_version': model_version,
            })

    # Step 4: Persist Predictions (Append-only)
    total_saved = save_predictions_bulk(predictions_to_save)

    # Step 5: Aggregate Validation Metrics
    avg_xgb = {}
    valid_xgb_maes = [m['mae'] for m in all_xgb_metrics if m.get('mae') is not None]
    if valid_xgb_maes:
        avg_xgb['mae'] = float(np.mean(valid_xgb_maes))
        avg_xgb['rmse'] = float(np.mean([m['rmse'] for m in all_xgb_metrics if m.get('rmse') is not None]))
        wapes = [m['wape'] for m in all_xgb_metrics if m.get('wape') is not None]
        if wapes:
            avg_xgb['wape'] = float(np.mean(wapes))
    else:
        avg_xgb = {'mae': None, 'rmse': None, 'wape': None}

    avg_baseline = {}
    valid_base_maes = [m['mae'] for m in all_baseline_metrics if m.get('mae') is not None]
    if valid_base_maes:
        avg_baseline['mae'] = float(np.mean(valid_base_maes))
        avg_baseline['rmse'] = float(np.mean([m['rmse'] for m in all_baseline_metrics if m.get('rmse') is not None]))
        wapes = [m['wape'] for m in all_baseline_metrics if m.get('wape') is not None]
        if wapes:
            avg_baseline['wape'] = float(np.mean(wapes))
    else:
        avg_baseline = {'mae': None, 'rmse': None, 'wape': None}

    # Step 6: Store Model Metadata
    save_model_metadata(
        model_version=model_version,
        data_range=quality['date_range'],
        total_series=total_series,
        total_predictions=total_saved,
        xgb_metrics=avg_xgb,
        baseline_metrics=avg_baseline,
        sufficient_count=sufficient_count,
        insufficient_count=insufficient_count,
        warnings=quality['warnings'],
        config={
            'min_history_days': MIN_HISTORY_DAYS,
            'min_history_days_baseline': MIN_HISTORY_DAYS_BASELINE,
            'forecast_horizon': FORECAST_HORIZON,
            'xgb_params': XGB_PARAMS,
            'target_col': target_col,
        }
    )

    return {
        'status': 'success',
        'model_version': model_version,
        'total_series': total_series,
        'xgboost_series': xgb_count,
        'baseline_series': baseline_count,
        'insufficient_data_series': insufficient_count,
        'total_predictions_generated': total_saved,
        'avg_xgb_metrics': avg_xgb,
        'avg_baseline_metrics': avg_baseline,
        'data_quality': quality,
    }

def run_data_validation(facility_id=None):
    """Executes data validation independently."""
    df = load_facility_data(facility_id=facility_id)
    return validate_dataset(df)

def run_model_evaluation(facility_id=None):
    """Retrieves recent evaluation metrics and diagnostics."""
    return get_all_metadata()

def backfill_actuals():
    """Triggers backfilling of actual demand for completed forecast dates."""
    return backfill_prediction_actuals()
