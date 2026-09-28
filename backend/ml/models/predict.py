"""
Prediction module for BloodChain ML subsystem.
Implements recursive multi-step forecasting across the 7-day horizon.
"""
import pandas as pd
from datetime import timedelta
from ml.config.ml_config import FORECAST_HORIZON
from ml.preprocessing.feature_engineering import build_feature_matrix, get_feature_columns

def generate_multi_step_forecast(model, history_df, future_dates, target_col='units_requested'):
    """
    Generates multi-step ahead forecasts across future_dates.
    Extends the series one day at a time, recursively updating lag and rolling features.
    """
    extended_df = history_df.copy()
    predictions = []

    for fd in future_dates:
        # Create a new future row
        new_row = extended_df.iloc[-1:].copy()
        new_row['date'] = pd.Timestamp(fd)
        new_row[target_col] = float('nan')

        extended_df = pd.concat([extended_df, new_row], ignore_index=True)

        # Recompute feature matrix on extended DataFrame
        feat_df = build_feature_matrix(extended_df, target_col)
        feat_cols = get_feature_columns(feat_df)

        last_row = feat_df.iloc[-1:]
        X_pred = last_row[feat_cols].fillna(0).values

        raw_pred = model.predict(X_pred)[0]
        pred_value = max(0.0, float(raw_pred))

        # Fill the predicted value into extended_df so subsequent lags (t-1, t-2...) have it
        extended_df.iloc[-1, extended_df.columns.get_loc(target_col)] = pred_value

        predictions.append({
            'forecast_date': fd.strftime('%Y-%m-%d') if hasattr(fd, 'strftime') else str(fd),
            'predicted_units': round(pred_value, 2),
            'model_used': 'ai_regressor',
        })

    return predictions
