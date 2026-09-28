# BloodChain Machine Learning Demand Forecasting Subsystem

## Overview
This package implements an isolated, facility-specific blood demand forecasting engine using **XGBoost**. It operates independently of the BloodChain frontend and web presentation layer.

## Architecture

```
ml/
├── config/                  # Hyperparameters, lag offsets, rolling window sizes
│   └── ml_config.py
├── preprocessing/           # Data loading, validation, feature engineering
│   ├── data_loader.py
│   ├── data_validator.py
│   └── feature_engineering.py
├── models/                  # Core algorithms, training, evaluation, inference
│   ├── xgboost_model.py
│   ├── train.py
│   ├── predict.py
│   └── evaluate.py
├── forecasting/             # High-level pipeline and orchestration
│   ├── demand_forecast.py
│   └── forecast_service.py
├── storage/                 # Persistence in PostgreSQL (append-only)
│   ├── model_repository.py
│   └── prediction_repository.py
├── tests/                   # Independent ML test suite
│   └── test_ml_pipeline.py
└── README.md
```

## Key Principles

1. **Decoupled from Frontend**: The frontend communicates solely via REST API endpoints (`/api/demand/forecast/`). No ML logic, pandas, or XGBoost libraries are imported by UI components.
2. **True Time-Series Integrity**:
   - Zero future data leakage: rolling windows and inventory metrics use `.shift(1)`.
   - Chronological validation split (last 15% of historical dates held out).
   - Recursive multi-step forecasting extending one day at a time across the 7-day horizon.
3. **Data Source & Storage**:
   - Ground truth: PostgreSQL `FacilityDailyRecord` (the original 292k-row CSV is never modified).
   - Predictions: Appended to `demand_predictions` table (historical predictions are never overwritten).
   - Metrics: Logged to `model_metadata` table.
4. **Baseline Comparison**:
   - Benchmarks against an empirical weekday-average model.
   - Evaluates MAE, RMSE, and WAPE on identical validation splits.

## CLI Usage

```bash
# Full pipeline for a facility:
python manage.py run_forecast --facility ch_h_01

# Data audit only:
python manage.py run_forecast --validate

# View model status & metrics:
python manage.py run_forecast --status

# Backfill actual units for expired forecast dates:
python manage.py run_forecast --backfill
```
