"""
Configuration constants and hyperparameters for BloodChain ML subsystem.
"""
import os

# Forecast horizon in days
FORECAST_HORIZON = 7

# Minimum historical days required for modeling
MIN_HISTORY_DAYS = 30           # Required for XGBoost training
MIN_HISTORY_DAYS_BASELINE = 14  # Required for fallback weekday-average baseline

# Chronological validation holdout fraction (last 15% of dates)
VALIDATION_FRACTION = 0.15

# Lag feature offsets (days in the past)
LAG_DAYS = [1, 2, 3, 7, 14, 21, 28]

# Rolling window sizes (days)
ROLLING_WINDOWS = [3, 7, 14, 30]

# Primary prediction target column
DEFAULT_TARGET_COL = 'units_requested'

def get_forecast_target(facility_type):
    """
    Centralized target-selection function for BloodChain forecasting.
    Normalizes facility_type (handles 'Hospital', 'HOSPITAL', 'Blood Bank', 'BLOOD_BANK', etc.)
    Returns:
        dict: {
            'target_field': str ('units_requested' | 'units_transferred_out'),
            'label': str ('Hospital Blood Demand Forecast' | 'Blood Bank Outbound Requirement Forecast'),
            'short_label': str ('Demand' | 'Outbound Requirement'),
            'forecast_type': str ('demand' | 'outbound_requirement')
        }
    """
    ft_norm = str(facility_type).strip().upper().replace(' ', '_')
    if 'BANK' in ft_norm:
        return {
            'target_field': 'units_transferred_out',
            'label': 'Blood Bank Outbound Requirement Forecast',
            'short_label': 'Outbound Requirement',
            'forecast_type': 'outbound_requirement'
        }
    else:
        # Default: Hospital
        return {
            'target_field': 'units_requested',
            'label': 'Hospital Blood Demand Forecast',
            'short_label': 'Demand',
            'forecast_type': 'demand'
        }

# XGBoost Regressor Hyperparameters
XGB_PARAMS = {
    'n_estimators': 100,
    'max_depth': 4,
    'learning_rate': 0.05,
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'reg_alpha': 0.1,
    'reg_lambda': 1.0,
    'random_state': 42,
    'n_jobs': -1,
}

# Artifact storage directory
MODEL_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    'ml_models'
)
os.makedirs(MODEL_DIR, exist_ok=True)
