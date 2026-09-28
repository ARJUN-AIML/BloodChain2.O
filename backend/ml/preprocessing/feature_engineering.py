"""
Feature engineering module for BloodChain ML subsystem.
Generates time, lag, rolling, and inventory features strictly from historical data.
Zero future data leakage: rolling windows and inventory metrics are shifted.
"""
import pandas as pd
from ml.config.ml_config import LAG_DAYS, ROLLING_WINDOWS

def create_time_features(df):
    """Adds calendar and seasonality features derived from the date column."""
    df = df.copy()
    df['day_of_week'] = df['date'].dt.dayofweek
    df['day_of_month'] = df['date'].dt.day
    df['week_of_year'] = df['date'].dt.isocalendar().week.astype(int)
    df['month'] = df['date'].dt.month
    df['quarter'] = df['date'].dt.quarter
    df['year'] = df['date'].dt.year
    df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
    return df

def create_lag_features(series_df, target_col='units_requested'):
    """
    Creates historical lag features for the target column.
    Uses strictly past values via .shift(lag).
    """
    df = series_df.copy()
    for lag in LAG_DAYS:
        df[f'lag_{lag}'] = df[target_col].shift(lag)
    return df

def create_rolling_features(series_df, target_col='units_requested'):
    """
    Creates rolling window statistics.
    CRITICAL: .shift(1) is applied first to ensure the current day's target
    is never included in the rolling window calculation.
    """
    df = series_df.copy()
    shifted_target = df[target_col].shift(1)

    for window in ROLLING_WINDOWS:
        df[f'roll_mean_{window}'] = shifted_target.rolling(window=window, min_periods=1).mean()

    df['roll_max_7'] = shifted_target.rolling(window=7, min_periods=1).max()
    df['roll_min_7'] = shifted_target.rolling(window=7, min_periods=1).min()
    df['roll_std_7'] = shifted_target.rolling(window=7, min_periods=1).std().fillna(0)
    return df

def create_inventory_features(series_df, target_col='units_requested'):
    """
    Creates shifted inventory state features.
    Ensures that only prior-day inventory states (t-1) are visible to the model.
    """
    df = series_df.copy()

    if 'available_stock' in df.columns:
        df['stock_lag_1'] = df['available_stock'].shift(1)
        df['stock_lag_7'] = df['available_stock'].shift(7)
        df['stock_roll_mean_7'] = df['available_stock'].shift(1).rolling(window=7, min_periods=1).mean()

    if 'units_issued' in df.columns:
        df['issued_lag_1'] = df['units_issued'].shift(1)
        df['issued_roll_mean_7'] = df['units_issued'].shift(1).rolling(window=7, min_periods=1).mean()

    if 'units_received' in df.columns:
        df['received_lag_1'] = df['units_received'].shift(1)

    # If target is units_transferred_out, lag_1 is already created from target.
    # Otherwise include transferred_lag_1 as context:
    if target_col != 'units_transferred_out' and 'units_transferred_out' in df.columns:
        df['transferred_lag_1'] = df['units_transferred_out'].shift(1)

    # If target is NOT units_requested, include requested_lag_1 as context:
    if target_col != 'units_requested' and 'units_requested' in df.columns:
        df['requested_lag_1'] = df['units_requested'].shift(1)

    return df

def build_feature_matrix(series_df, target_col='units_requested'):
    """
    Chains all feature engineering steps on a single time-series DataFrame.
    Guarantees chronological ordering before calculating time-dependent features.
    """
    df = series_df.sort_values('date').copy()
    df = create_time_features(df)
    df = create_lag_features(df, target_col)
    df = create_rolling_features(df, target_col)
    df = create_inventory_features(df, target_col)
    return df

def get_feature_columns(df):
    """
    Returns the list of engineered feature column names available for training.
    Excludes identifiers, raw dates, and unlagged target/inventory columns.
    """
    exclude = {
        'facility_id', 'facility_name', 'facility_type', 'district',
        'date', 'blood_group', 'blood_component',
        'units_requested', 'units_issued', 'units_received',
        'units_transferred_out', 'units_expired', 'available_stock'
    }
    return [c for c in df.columns if c not in exclude]
