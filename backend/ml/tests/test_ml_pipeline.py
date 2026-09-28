"""
Automated test suite for BloodChain ML demand forecasting subsystem.
Can be executed independently of the web frontend and browser.
"""
import os
import unittest
import pandas as pd
import numpy as np
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
from django.conf import settings
if not settings.configured:
    django.setup()

from ml.config.ml_config import XGB_PARAMS, FORECAST_HORIZON
from ml.preprocessing.data_validator import validate_dataset, validate_series_sufficiency
from ml.preprocessing.feature_engineering import (
    build_feature_matrix,
    get_feature_columns,
    create_time_features,
    create_lag_features,
    create_rolling_features
)
from ml.models.train import split_chronological, train_series_model
from ml.models.evaluate import calculate_metrics, baseline_weekday_average, evaluate_validation_split
from ml.models.predict import generate_multi_step_forecast
from ml.storage.prediction_repository import get_facility_predictions, get_historical_actuals

class TestMLPipeline(unittest.TestCase):

    def setUp(self):
        # Create a synthetic 100-day series for isolated unit testing
        base = date(2025, 1, 1)
        dates = [base + timedelta(days=i) for i in range(100)]
        self.sample_df = pd.DataFrame({
            'facility_id': 'test_fac',
            'facility_name': 'Test Hospital',
            'facility_type': 'Hospital',
            'district': 'Chennai',
            'date': pd.to_datetime(dates),
            'blood_group': 'O+',
            'blood_component': 'RBC',
            'units_requested': np.random.poisson(lam=5.0, size=100),
            'units_issued': np.random.poisson(lam=4.0, size=100),
            'units_received': np.random.poisson(lam=6.0, size=100),
            'units_transferred_out': np.zeros(100, dtype=int),
            'units_expired': np.zeros(100, dtype=int),
            'available_stock': np.random.randint(20, 100, size=100)
        })

    def test_data_validation(self):
        report = validate_dataset(self.sample_df)
        self.assertEqual(report['total_rows'], 100)
        self.assertEqual(report['unique_facilities'], 1)
        self.assertEqual(len(report['missing_values']), 0)
        self.assertEqual(report['duplicate_rows'], 0)

    def test_series_sufficiency(self):
        status, count = validate_series_sufficiency(self.sample_df)
        self.assertEqual(status, 'xgboost')
        self.assertEqual(count, 100)

        short_df = self.sample_df.iloc[:20]
        status_short, _ = validate_series_sufficiency(short_df)
        self.assertEqual(status_short, 'baseline_only')

        tiny_df = self.sample_df.iloc[:5]
        status_tiny, _ = validate_series_sufficiency(tiny_df)
        self.assertEqual(status_tiny, 'insufficient_data')

    def test_feature_engineering_no_leakage(self):
        feat_df = build_feature_matrix(self.sample_df)
        features = get_feature_columns(feat_df)

        self.assertIn('day_of_week', features)
        self.assertIn('lag_1', features)
        self.assertIn('lag_7', features)
        self.assertIn('roll_mean_7', features)

        # Verify that lag_1 at index 10 equals units_requested at index 9
        idx = 10
        expected_lag1 = self.sample_df.loc[idx - 1, 'units_requested']
        actual_lag1 = feat_df.loc[idx, 'lag_1']
        self.assertEqual(expected_lag1, actual_lag1)

    def test_chronological_split(self):
        feat_df = build_feature_matrix(self.sample_df)
        features = get_feature_columns(feat_df)
        train_clean, val_clean = split_chronological(feat_df, features)

        # Validation dates must strictly succeed training dates
        max_train_date = train_clean['date'].max()
        min_val_date = val_clean['date'].min()
        self.assertLess(max_train_date, min_val_date)

    def test_train_and_evaluate(self):
        feat_df = build_feature_matrix(self.sample_df)
        features = get_feature_columns(feat_df)
        train_clean, val_clean = split_chronological(feat_df, features)

        model = train_series_model(train_clean, features)
        metrics = evaluate_validation_split(model, val_clean, train_clean, features)

        self.assertIn('xgboost', metrics)
        self.assertIn('baseline', metrics)
        self.assertIsNotNone(metrics['xgboost']['mae'])
        self.assertIsNotNone(metrics['baseline']['mae'])

    def test_multi_step_prediction(self):
        feat_df = build_feature_matrix(self.sample_df)
        features = get_feature_columns(feat_df)
        train_clean, _ = split_chronological(feat_df, features)
        model = train_series_model(train_clean, features)

        future_dates = [date.today() + timedelta(days=i + 1) for i in range(7)]
        preds = generate_multi_step_forecast(model, self.sample_df, future_dates)

        self.assertEqual(len(preds), 7)
        for p in preds:
            self.assertGreaterEqual(p['predicted_units'], 0)
            self.assertEqual(p['model_used'], 'xgboost')

if __name__ == '__main__':
    unittest.main()
