"""
Demand forecasting module for individual blood product series.
Orchestrates training, evaluation, diagnostic logging, and 7-day prediction generation.
Completely unified for both Hospitals (units_requested) and Blood Banks (units_transferred_out).
"""
import logging
from datetime import date, timedelta, datetime
import numpy as np
import pandas as pd
from ml.config.ml_config import FORECAST_HORIZON, DEFAULT_TARGET_COL
from ml.preprocessing.data_validator import validate_series_sufficiency
from ml.preprocessing.feature_engineering import build_feature_matrix, get_feature_columns
from ml.models.train import split_chronological, train_series_model
from ml.models.evaluate import baseline_weekday_average, evaluate_validation_split
from ml.models.predict import generate_multi_step_forecast
from ml.storage.model_repository import save_model_artifact

logger = logging.getLogger('bloodchain.ml')

def forecast_single_series(
    series_df,
    series_key,
    model_version,
    target_col=DEFAULT_TARGET_COL,
    forecast_start_date=None,
    horizon_days=None
):
    """
    Executes the forecasting workflow for one (facility, blood_group, blood_component) series.
    Returns:
        dict: {
            'status': 'xgboost' | 'baseline_only' | 'insufficient_data' | 'no_historical_demand',
            'series_key': series_key,
            'predictions': list of {forecast_date, predicted_units, model_used},
            'metrics': {'xgboost': {...}, 'baseline': {...}},
            'model_path': str or None,
            'distribution': {...}
        }
    """
    fid, bg, comp = series_key
    status, history_days = validate_series_sufficiency(series_df)

    # Determine forecast dates based on dynamic horizon (7, 14, 30 days)
    if forecast_start_date is not None:
        if isinstance(forecast_start_date, str):
            base_date = datetime.strptime(forecast_start_date, '%Y-%m-%d').date()
        elif hasattr(forecast_start_date, 'date'):
            base_date = forecast_start_date.date()
        else:
            base_date = forecast_start_date
    else:
        # Default: Forecast starting from today (tomorrow onwards)
        base_date = date.today()

    horizon = int(horizon_days) if horizon_days is not None else FORECAST_HORIZON
    future_dates = [base_date + timedelta(days=i + 1) for i in range(horizon)]

    # Handle insufficient historical observations
    if status == 'insufficient_data':
        insufficient_msg = (
            "Insufficient historical demand data."
            if target_col == 'units_requested'
            else "Insufficient historical outbound data."
        )
        return {
            'status': 'insufficient_data',
            'series_key': series_key,
            'history_days': history_days,
            'status_note': insufficient_msg,
            'predictions': [],
            'metrics': {
                'xgboost': {'mae': None, 'rmse': None, 'wape': None},
                'baseline': {'mae': None, 'rmse': None, 'wape': None}
            },
            'model_path': None,
            'distribution': None
        }

    # Extract target series and compute historical distribution
    target_series = series_df[target_col].dropna() if target_col in series_df.columns else pd.Series([], dtype=float)
    hist_min = float(target_series.min()) if len(target_series) > 0 else 0.0
    hist_max = float(target_series.max()) if len(target_series) > 0 else 0.0
    hist_mean = float(target_series.mean()) if len(target_series) > 0 else 0.0
    hist_median = float(target_series.median()) if len(target_series) > 0 else 0.0
    hist_std = float(target_series.std()) if len(target_series) > 1 else 0.0
    recent_7d_avg = float(target_series.tail(7).mean()) if len(target_series) > 0 else 0.0
    recent_30d_avg = float(target_series.tail(30).mean()) if len(target_series) > 0 else 0.0
    non_zero_count = int((target_series > 0).sum())

    # PRINT DIAGNOSTIC VALUES BEFORE TRAINING (Audit Requirement 3)
    print(f"\n[ML-DIAGNOSTIC] Series: {fid} | {bg} | {comp}")
    print(f"  TARGET:                {target_col}")
    print(f"  TRAINING ROWS (raw):   {len(series_df)}")
    print(f"  TARGET MIN:            {hist_min}")
    print(f"  TARGET MAX:            {hist_max}")
    print(f"  TARGET MEAN:           {hist_mean:.2f}")
    print(f"  NON-ZERO TARGET COUNT: {non_zero_count}")
    print(f"  HISTORICAL MEDIAN:     {hist_median:.2f}")
    print(f"  HISTORICAL STD:        {hist_std:.2f}")
    print(f"  RECENT 7-DAY AVG:      {recent_7d_avg:.2f}")
    print(f"  RECENT 30-DAY AVG:     {recent_30d_avg:.2f}")

    # Check genuinely zero demand across historical dataset
    if hist_max == 0.0 or non_zero_count == 0:
        predictions = [
            {
                'forecast_date': fd.strftime('%Y-%m-%d') if hasattr(fd, 'strftime') else str(fd),
                'predicted_units': 0.0,
                'model_used': 'zero_demand_historical'
            }
            for fd in future_dates
        ]
        return {
            'status': 'no_historical_demand',
            'series_key': series_key,
            'history_days': history_days,
            'status_note': 'No historical requirement recorded for this series',
            'predictions': predictions,
            'metrics': {
                'xgboost': {'mae': None, 'rmse': None, 'wape': None},
                'baseline': {'mae': None, 'rmse': None, 'wape': None}
            },
            'model_path': None,
            'distribution': {
                'min': hist_min, 'max': hist_max, 'mean': hist_mean,
                'median': hist_median, 'std': hist_std,
                'recent_7d_avg': recent_7d_avg, 'recent_30d_avg': recent_30d_avg,
                'non_zero_count': non_zero_count,
                'forecast_mean': 0.0, 'forecast_max': 0.0, 'forecast_min': 0.0,
                'is_suspicious': False
            }
        }

    if status == 'baseline_only':
        baseline_preds = baseline_weekday_average(series_df, future_dates, target_col)
        predictions = [
            {
                'forecast_date': fd.strftime('%Y-%m-%d') if hasattr(fd, 'strftime') else str(fd),
                'predicted_units': round(p, 2),
                'model_used': 'baseline_weekday_avg'
            }
            for fd, p in zip(future_dates, baseline_preds)
        ]
        return {
            'status': 'baseline_only',
            'series_key': series_key,
            'history_days': history_days,
            'status_note': 'Baseline rolling average benchmark applied',
            'predictions': predictions,
            'metrics': {},
            'model_path': None,
            'distribution': {
                'min': hist_min, 'max': hist_max, 'mean': hist_mean,
                'median': hist_median, 'std': hist_std,
                'recent_7d_avg': recent_7d_avg, 'recent_30d_avg': recent_30d_avg,
                'non_zero_count': non_zero_count,
                'forecast_mean': float(np.mean(baseline_preds)),
                'forecast_max': float(np.max(baseline_preds)),
                'forecast_min': float(np.min(baseline_preds)),
                'is_suspicious': False
            }
        }

    # Step 1: Feature Engineering
    feature_df = build_feature_matrix(series_df, target_col)
    features = get_feature_columns(feature_df)

    if not features:
        return {
            'status': 'no_features',
            'series_key': series_key,
            'predictions': [],
            'metrics': {},
            'model_path': None,
            'distribution': None
        }

    # Step 2: Chronological Train/Validation Split
    train_clean, val_clean = split_chronological(feature_df, features, target_col)
    print(f"  [TRAIN-SPLIT] Clean Training Rows: {len(train_clean)} | Validation Rows: {len(val_clean)}")

    if len(train_clean) < 10:
        # Fallback to weekday-average baseline if clean training rows are insufficient
        baseline_preds = baseline_weekday_average(series_df, future_dates, target_col)
        predictions = [
            {
                'forecast_date': fd.strftime('%Y-%m-%d') if hasattr(fd, 'strftime') else str(fd),
                'predicted_units': round(p, 2),
                'model_used': 'baseline_weekday_avg'
            }
            for fd, p in zip(future_dates, baseline_preds)
        ]
        return {
            'status': 'baseline_only',
            'series_key': series_key,
            'history_days': history_days,
            'status_note': 'Baseline benchmark (insufficient training rows after lag construction)',
            'predictions': predictions,
            'metrics': {},
            'model_path': None,
            'distribution': {
                'min': hist_min, 'max': hist_max, 'mean': hist_mean,
                'median': hist_median, 'std': hist_std,
                'recent_7d_avg': recent_7d_avg, 'recent_30d_avg': recent_30d_avg,
                'non_zero_count': non_zero_count,
                'forecast_mean': float(np.mean(baseline_preds)),
                'forecast_max': float(np.max(baseline_preds)),
                'forecast_min': float(np.min(baseline_preds)),
                'is_suspicious': False
            }
        }

    # Step 3: Train XGBoost Model
    y_train = train_clean[target_col].values
    print(f"  [XGBOOST-TRAIN] y_train Min: {y_train.min():.1f}, Max: {y_train.max():.1f}, Mean: {y_train.mean():.2f}, Non-Zero: {(y_train > 0).sum()}")
    model = train_series_model(train_clean, features, target_col)

    # Step 4: Evaluate against Holdout and Baseline
    metrics = evaluate_validation_split(model, val_clean, train_clean, features, target_col)

    # Step 5: Save Model Artifact
    model_path = save_model_artifact(model, model_version, series_key)

    # Step 6: Generate Multi-Step 7-Day Forecast
    predictions = generate_multi_step_forecast(model, series_df, future_dates, target_col)

    # Step 7: Realistic Scale Check (Audit Requirement 7 & 24)
    pred_vals = [p['predicted_units'] for p in predictions]
    forecast_mean = float(np.mean(pred_vals)) if pred_vals else 0.0
    forecast_max = float(np.max(pred_vals)) if pred_vals else 0.0
    forecast_min = float(np.min(pred_vals)) if pred_vals else 0.0

    is_suspicious = False
    if non_zero_count >= 10 and forecast_mean == 0.0:
        logger.warning(f"SUSPICIOUS FORECAST: {series_key} has {non_zero_count} non-zero records but predicted 0.0!")
        is_suspicious = True
    elif forecast_max > 3.0 * max(hist_max, 5.0):
        logger.warning(f"SUSPICIOUS FORECAST: {series_key} forecast max ({forecast_max}) exceeds 3x historical max ({hist_max})!")
        is_suspicious = True

    print(f"  [SCALE-CHECK] Hist Mean={hist_mean:.2f}, Hist Max={hist_max:.2f} | Forecast Mean={forecast_mean:.2f}, Forecast Max={forecast_max:.2f} | Suspicious={is_suspicious}")

    return {
        'status': 'xgboost',
        'series_key': series_key,
        'history_days': history_days,
        'predictions': predictions,
        'metrics': metrics,
        'model_path': model_path,
        'distribution': {
            'min': hist_min,
            'max': hist_max,
            'mean': round(hist_mean, 2),
            'median': round(hist_median, 2),
            'std': round(hist_std, 2),
            'recent_7d_avg': round(recent_7d_avg, 2),
            'recent_30d_avg': round(recent_30d_avg, 2),
            'non_zero_count': non_zero_count,
            'forecast_mean': round(forecast_mean, 2),
            'forecast_max': round(forecast_max, 2),
            'forecast_min': round(forecast_min, 2),
            'is_suspicious': is_suspicious
        }
    }
