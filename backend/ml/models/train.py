"""
Model training module for BloodChain ML subsystem.
Implements chronological train/validation splitting without data leakage.
"""
import numpy as np
from ml.config.ml_config import VALIDATION_FRACTION
from ml.models.xgboost_model import create_xgboost_regressor

def split_chronological(feature_df, features, target_col='units_requested'):
    """
    Performs a chronological train/validation split.
    The last VALIDATION_FRACTION of dates is held out.
    """
    df_clean = feature_df.dropna(subset=[target_col]).copy()
    val_size = max(7, int(len(df_clean) * VALIDATION_FRACTION))
    train_end_idx = len(df_clean) - val_size

    train_df = df_clean.iloc[:train_end_idx]
    val_df = df_clean.iloc[train_end_idx:]

    train_clean = train_df.dropna(subset=features)
    val_clean = val_df.dropna(subset=features)

    return train_clean, val_clean

def train_series_model(train_clean, features, target_col='units_requested', custom_params=None):
    """
    Trains an XGBoost regressor on the chronological training split.
    """
    X_train = train_clean[features].values
    y_train = train_clean[target_col].values

    model = create_xgboost_regressor(custom_params)
    model.fit(X_train, y_train, verbose=False)
    return model
