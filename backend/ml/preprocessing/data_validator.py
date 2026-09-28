"""
Data validation module for BloodChain ML subsystem.
Audits time-series data quality, integrity, and minimum history requirements.
"""
import pandas as pd
from ml.config.ml_config import MIN_HISTORY_DAYS, MIN_HISTORY_DAYS_BASELINE

def validate_dataset(df):
    """
    Audits the input DataFrame for data quality issues.
    Returns a comprehensive dictionary report. Does NOT modify the DataFrame.
    """
    report = {
        'total_rows': len(df),
        'total_columns': len(df.columns) if len(df) > 0 else 0,
        'date_range': None,
        'unique_facilities': 0,
        'hospitals': 0,
        'blood_banks': 0,
        'unique_blood_groups': 0,
        'unique_components': 0,
        'missing_values': {},
        'duplicate_rows': 0,
        'negative_values': {},
        'warnings': [],
    }

    if len(df) == 0:
        report['warnings'].append('Dataset is empty!')
        return report

    report['date_range'] = {
        'start': str(df['date'].min().date()),
        'end': str(df['date'].max().date()),
        'total_calendar_days': (df['date'].max() - df['date'].min()).days + 1,
        'unique_dates': df['date'].nunique(),
    }
    report['unique_facilities'] = int(df['facility_id'].nunique())

    if 'facility_type' in df.columns:
        ft_counts = df.groupby('facility_type')['facility_id'].nunique()
        report['hospitals'] = int(ft_counts.get('Hospital', 0))
        report['blood_banks'] = int(ft_counts.get('Blood Bank', 0))

    report['unique_blood_groups'] = int(df['blood_group'].nunique())
    report['unique_components'] = int(df['blood_component'].nunique())

    # Check missing values
    for col in df.columns:
        null_count = int(df[col].isnull().sum())
        if null_count > 0:
            report['missing_values'][col] = null_count
            report['warnings'].append(f"Missing {null_count} values in {col}")

    # Check duplicates
    report['duplicate_rows'] = int(df.duplicated().sum())
    if report['duplicate_rows'] > 0:
        report['warnings'].append(f"{report['duplicate_rows']} duplicate rows detected")

    # Check negative numbers in numeric columns
    numeric_cols = [
        'units_requested', 'units_issued', 'units_received',
        'units_transferred_out', 'units_expired', 'available_stock'
    ]
    for col in numeric_cols:
        if col in df.columns:
            neg_count = int((df[col] < 0).sum())
            if neg_count > 0:
                report['negative_values'][col] = neg_count
                report['warnings'].append(f"{neg_count} negative values detected in {col}")

    # Check date continuity
    total_cal = report['date_range']['total_calendar_days']
    unique_dates = report['date_range']['unique_dates']
    if total_cal != unique_dates:
        report['warnings'].append(
            f"Dates not fully continuous: {unique_dates} unique dates across {total_cal} calendar days"
        )

    return report

def validate_series_sufficiency(series_df):
    """
    Validates whether an individual time series has sufficient history.
    Returns: ('xgboost', count) | ('baseline_only', count) | ('insufficient_data', count)
    """
    unique_days = series_df['date'].nunique() if len(series_df) > 0 else 0

    if unique_days < MIN_HISTORY_DAYS_BASELINE:
        return 'insufficient_data', unique_days
    elif unique_days < MIN_HISTORY_DAYS:
        return 'baseline_only', unique_days
    else:
        return 'xgboost', unique_days
