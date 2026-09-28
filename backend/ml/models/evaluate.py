"""
Model evaluation module for BloodChain ML subsystem.
Calculates MAE, RMSE, and WAPE against ground truth and benchmarks against a weekday-average baseline.
"""
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error

def calculate_metrics(y_true, y_pred):
    """
    Computes MAE, RMSE, and WAPE between ground truth and predictions.
    """
    if len(y_true) == 0:
        return {'mae': None, 'rmse': None, 'wape': None}

    y_pred_clipped = np.maximum(y_pred, 0)
    mae = float(mean_absolute_error(y_true, y_pred_clipped))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred_clipped)))

    total_actual = float(np.sum(np.abs(y_true)))
    wape = float(np.sum(np.abs(y_true - y_pred_clipped)) / total_actual) if total_actual > 0 else None

    return {
        'mae': round(mae, 4),
        'rmse': round(rmse, 4),
        'wape': round(wape, 4) if wape is not None else None,
    }

def baseline_weekday_average(history_df, dates_to_predict, target_col='units_requested'):
    """
    Calculates historical weekday-average predictions as a robust benchmark.
    Falls back to overall mean if a weekday is unseen.
    """
    df = history_df.copy()
    if 'day_of_week' not in df.columns:
        df['day_of_week'] = df['date'].dt.dayofweek

    dow_means = df.groupby('day_of_week')[target_col].mean().to_dict()
    global_mean = float(df[target_col].mean()) if len(df) > 0 else 0.0

    predictions = []
    for d in dates_to_predict:
        if isinstance(d, str):
            d = pd.to_datetime(d)
        dow = d.dayofweek if hasattr(d, 'dayofweek') else d.weekday()
        val = dow_means.get(dow, global_mean)
        predictions.append(max(0.0, float(val)))

    return predictions

def evaluate_validation_split(model, val_clean, train_clean, features, target_col='units_requested'):
    """
    Evaluates both the trained XGBoost model and the Baseline on the validation holdout.
    """
    if len(val_clean) == 0:
        return {'xgboost': {}, 'baseline': {}}

    X_val = val_clean[features].values
    y_val = val_clean[target_col].values

    # XGBoost evaluation
    xgb_preds = model.predict(X_val)
    xgb_metrics = calculate_metrics(y_val, xgb_preds)

    # Baseline evaluation
    val_dates = val_clean['date'].tolist()
    baseline_preds = baseline_weekday_average(train_clean, val_dates, target_col)
    baseline_metrics = calculate_metrics(y_val, np.array(baseline_preds[:len(y_val)]))

    return {
        'xgboost': xgb_metrics,
        'baseline': baseline_metrics,
        'validation_samples': len(val_clean),
        'training_samples': len(train_clean),
    }
