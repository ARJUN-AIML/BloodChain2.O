"""
XGBoost model definition for BloodChain demand forecasting.
"""
import xgboost as xgb
from ml.config.ml_config import XGB_PARAMS

def create_xgboost_regressor(custom_params=None):
    """
    Initializes an XGBoost Regressor with standardized hyperparameters.
    """
    params = dict(XGB_PARAMS)
    if custom_params:
        params.update(custom_params)
    return xgb.XGBRegressor(**params)

def get_feature_importances(model, feature_names):
    """
    Extracts sorted feature importances from a trained XGBoost model.
    """
    if not hasattr(model, 'feature_importances_'):
        return {}
    importances = model.feature_importances_
    pairs = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
    return {name: float(val) for name, val in pairs}
