"""
ML Demand Forecasting Service for BloodChain Portal-V2.
Connects PostgreSQL historical data -> ML preprocessing -> XGBoost -> 7-day forecast -> PostgreSQL prediction storage -> API.
Provides facility-isolated, role-specific forecasting for Hospitals (units_requested) and Blood Banks (units_transferred_out).
Supports all 50 accredited facilities in the database with dynamic on-demand forecasting.
"""
import logging
from datetime import date, timedelta, datetime
from django.db.models import Sum, Avg
from apps.inventory.models import FacilityDailyRecord, BloodInventory, BLOOD_GROUPS, BLOOD_COMPONENTS
from apps.demand.models import DemandPrediction, ModelMetadata
from ml.config.ml_config import get_forecast_target, FORECAST_HORIZON
from ml.preprocessing.data_loader import load_single_series
from ml.forecasting.demand_forecast import forecast_single_series
from ml.storage.model_repository import generate_model_version
from ml.storage.prediction_repository import get_historical_actuals, save_predictions_bulk

logger = logging.getLogger('bloodchain.ml')

def normalize_blood_group(bg_str):
    """
    Normalizes blood group strings from frontend or URL query params:
    Handles 'O+', 'O POS', 'O_POS', 'OPOS', 'O-', 'A+', etc.
    """
    if not bg_str:
        return 'O+'
    b = str(bg_str).strip().upper()
    b = b.replace(' POSITIVE', '+').replace(' NEGATIVE', '-')
    b = b.replace(' POS', '+').replace(' NEG', '-')
    b = b.replace('_POS', '+').replace('_NEG', '-')
    b = b.replace('POS', '+').replace('NEG', '-')
    b = b.replace(' ', '')
    valid_groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    for vg in valid_groups:
        if b == vg:
            return vg
    return 'O+'

def normalize_component(comp_str):
    """
    Normalizes component strings:
    Handles 'RBC', 'RBC (PRBC Packed Cells)', 'Red Blood Cells (PRBC)', 'Platelets', 'Plasma', etc.
    """
    if not comp_str:
        return 'RBC'
    c = str(comp_str).strip()
    c_lower = c.lower()
    if 'prbc' in c_lower or 'red' in c_lower or c_lower.startswith('rbc'):
        return 'RBC'
    elif 'granulo' in c_lower or 'white' in c_lower or c_lower.startswith('wbc'):
        return 'WBC'
    elif 'platelet' in c_lower:
        return 'Platelets'
    elif 'plasma' in c_lower or 'ffp' in c_lower:
        return 'Plasma'
    elif 'cryo' in c_lower:
        return 'Cryoprecipitate'
    elif 'whole' in c_lower:
        return 'Whole Blood'
    return c

class DemandPredictionService:
    @staticmethod
    def get_forecast_data(facility, blood_group='O+', blood_component='RBC', days=14, forecast_days=None):
        """
        Retrieves end-to-end forecasting data for an authenticated facility.
        Guarantees:
        - Hospital target = units_requested ("Hospital Blood Demand Forecast")
        - Blood Bank target = units_transferred_out ("Blood Bank Outbound Requirement Forecast")
        - Dropdown, Calendar and Graph consume the exact same future predictions
        - Real historical data from FacilityDailyRecord
        - Predictions loaded from PostgreSQL demand_predictions or generated on-demand via ML
        - Supports dynamic horizon: 7, 14, 30 days
        """
        facility_id = facility.facility_id
        target_info = get_forecast_target(facility.facility_type)
        forecast_target = target_info['target_field']
        facility_label = target_info['label']
        short_label = target_info['short_label']

        # Normalize blood group and component
        clean_bg = normalize_blood_group(blood_group)
        clean_comp = normalize_component(blood_component)

        # 1. Discover available components and blood groups in this facility's records
        raw_components = list(
            FacilityDailyRecord.objects.filter(facility_id=facility_id)
            .values_list('blood_component', flat=True)
            .distinct()
        )
        std_order = ['RBC', 'WBC', 'Platelets', 'Plasma', 'Whole Blood', 'Cryoprecipitate']
        available_components = [c for c in std_order if c in raw_components]
        for c in raw_components:
            if c not in available_components:
                available_components.append(c)

        if not available_components:
            available_components = ['RBC', 'WBC', 'Platelets', 'Plasma', 'Whole Blood', 'Cryoprecipitate']

        available_blood_groups = [bg[0] for bg in BLOOD_GROUPS]

        if clean_comp not in available_components:
            clean_comp = available_components[0] if available_components else 'RBC'

        try:
            history_days = max(7, min(90, int(days or 14)))
        except (ValueError, TypeError):
            history_days = 14

        try:
            horizon = max(7, min(60, int(forecast_days or 7)))
        except (ValueError, TypeError):
            horizon = 7

        # 2. Historical Actuals (from actual PostgreSQL FacilityDailyRecord)
        history = get_historical_actuals(
            facility_id=facility_id,
            days=history_days,
            blood_group=clean_bg,
            blood_component=clean_comp,
            target_col=forecast_target
        )

        # 3. Dynamic Future Predictions (moving forward automatically according to horizon: 7, 14, 30 days)
        today = date.today()
        future_dates = [today + timedelta(days=i) for i in range(1, horizon + 1)]
        future_date_strs = [fd.strftime('%Y-%m-%d') for fd in future_dates]

        # Query latest stored predictions for this facility, target, blood_group, and component
        stored_preds = (
            DemandPrediction.objects.filter(
                facility_id=facility_id,
                forecast_target=forecast_target,
                blood_group=clean_bg,
                blood_component=clean_comp,
                forecast_date__gte=future_dates[0],
                forecast_date__lte=future_dates[-1]
            )
            .order_by('-generated_at')
        )

        date_to_pred = {}
        model_version_used = None
        for p in stored_preds:
            fd_str = p.forecast_date.strftime('%Y-%m-%d')
            if fd_str not in date_to_pred:
                date_to_pred[fd_str] = round(p.predicted_units, 2)
                if not model_version_used:
                    model_version_used = p.model_version

        # 4. Check if all future days are present
        has_all = all(fd_str in date_to_pred for fd_str in future_date_strs)

        if not has_all:
            # Generate predictions on-demand using existing XGBoost pipeline
            series_df = load_single_series(facility_id, clean_bg, clean_comp)
            if len(series_df) < 14:
                # Insufficient historical data condition (< 14 days)
                insufficient_msg = (
                    "Insufficient historical demand data."
                    if forecast_target == 'units_requested'
                    else "Insufficient historical outbound data."
                )
                return {
                    'status': 'insufficient_data',
                    'risk_label': 'Insufficient Data',
                    'status_note': insufficient_msg,
                    'facility': {
                        'facility_id': facility_id,
                        'facility_name': facility.name,
                        'facility_type': facility.facility_type,
                        'forecast_target': forecast_target,
                        'label': facility_label,
                        'short_label': short_label,
                    },
                    'filter': {
                        'blood_group': clean_bg,
                        'blood_component': clean_comp,
                        'days': history_days,
                        'forecast_days': horizon
                    },
                    'available_filters': {
                        'blood_groups': available_blood_groups,
                        'components': available_components
                    },
                    'daily_forecast': [],
                    'history': history,
                    'summary': {
                        'total_expected': 'N/A',
                        'daily_average': 'N/A',
                        'peak_day': 'N/A',
                        'peak_units': 'N/A',
                        'usable_inventory': 0,
                        'reserved_inventory': 0,
                        'in_transit_inventory': 0,
                        'potential_stock_gap': 'N/A',
                        'risk_label': 'Insufficient Data',
                        'forecast_days': horizon
                    },
                    'predictions': [],
                    'model_info': {
                        'model_version': 'N/A',
                        'algorithm': 'Predictive AI Regressor',
                        'status': 'Insufficient historical records (< 14 days)'
                    }
                }

            # Run forecast for this single series with dynamic horizon
            new_model_version = generate_model_version(facility_id)
            res = forecast_single_series(
                series_df,
                (facility_id, clean_bg, clean_comp),
                new_model_version,
                target_col=forecast_target,
                horizon_days=horizon
            )

            if res['status'] == 'insufficient_data':
                insufficient_msg = (
                    "Insufficient historical demand data."
                    if forecast_target == 'units_requested'
                    else "Insufficient historical outbound data."
                )
                return {
                    'status': 'insufficient_data',
                    'risk_label': 'Insufficient Data',
                    'status_note': insufficient_msg,
                    'facility': {
                        'facility_id': facility_id,
                        'facility_name': facility.name,
                        'facility_type': facility.facility_type,
                        'forecast_target': forecast_target,
                        'label': facility_label,
                        'short_label': short_label,
                    },
                    'filter': {
                        'blood_group': clean_bg,
                        'blood_component': clean_comp,
                        'days': history_days,
                        'forecast_days': horizon
                    },
                    'available_filters': {
                        'blood_groups': available_blood_groups,
                        'components': available_components
                    },
                    'daily_forecast': [],
                    'history': history,
                    'summary': {
                        'total_expected': 'N/A',
                        'daily_average': 'N/A',
                        'peak_day': 'N/A',
                        'peak_units': 'N/A',
                        'usable_inventory': 0,
                        'reserved_inventory': 0,
                        'in_transit_inventory': 0,
                        'potential_stock_gap': 'N/A',
                        'risk_label': 'Insufficient Data',
                        'forecast_days': horizon
                    },
                    'predictions': [],
                    'model_info': {
                        'model_version': 'N/A',
                        'algorithm': 'Predictive AI Regressor',
                        'status': 'Insufficient historical records'
                    }
                }

            # Save generated predictions to PostgreSQL demand_predictions table
            to_save = [
                {
                    'facility_id': facility_id,
                    'facility_type': facility.facility_type,
                    'forecast_target': forecast_target,
                    'blood_group': clean_bg,
                    'blood_component': clean_comp,
                    'forecast_date': p['forecast_date'],
                    'predicted_units': p['predicted_units'],
                    'model_version': new_model_version,
                }
                for p in res['predictions']
            ]
            save_predictions_bulk(to_save)

            # Update map
            for p in res['predictions']:
                date_to_pred[p['forecast_date']] = p['predicted_units']
            model_version_used = new_model_version

        # 5. Build Unified Forecast Array (Shared between Dropdown, Calendar & Graph)
        daily_forecast = []
        for fd in future_dates:
            fd_str = fd.strftime('%Y-%m-%d')
            val = date_to_pred.get(fd_str, 0.0)
            daily_forecast.append({
                'forecast_date': fd_str,
                'day_name': fd.strftime('%a'),
                'display_label': fd.strftime('%b %d'),
                'predicted_units': round(float(val), 2),
                'model_used': 'ai_regressor'
            })

        # 6. Current Usable Inventory & Potential Stock Gap
        inv = BloodInventory.objects.filter(
            facility=facility,
            blood_group=clean_bg,
            blood_component=clean_comp
        ).first()

        usable_inv = inv.available_units if inv else 0
        reserved_inv = inv.reserved_units if inv else 0
        in_transit_inv = inv.in_transit_units if inv else 0

        pred_values = [p['predicted_units'] for p in daily_forecast]
        total_expected = round(sum(pred_values), 1)
        daily_avg = round(total_expected / float(len(daily_forecast)), 1) if daily_forecast else 0.0

        peak_idx = pred_values.index(max(pred_values)) if pred_values else 0
        peak_day = daily_forecast[peak_idx]['display_label'] if daily_forecast else 'N/A'
        peak_units = daily_forecast[peak_idx]['predicted_units'] if daily_forecast else 0.0

        # Potential stock gap = Predicted Demand - Usable Inventory
        potential_gap = round(max(0.0, total_expected - usable_inv), 1)

        # Risk level determination based on inventory vs predicted requirement
        if usable_inv == 0 and total_expected > 0:
            risk_label = 'CRITICAL SHORTAGE'
        elif usable_inv < daily_avg * 2:
            risk_label = 'HIGH DEFICIT RISK'
        elif usable_inv < total_expected:
            risk_label = 'MODERATE GAP'
        else:
            risk_label = 'OPTIMAL BUFFER'

        # 7. Compatibility Predictions List for legacy or multi-card consumers
        all_bg_predictions = []
        for bg_code, _ in BLOOD_GROUPS:
            if bg_code == clean_bg:
                all_bg_predictions.append({
                    'blood_group': bg_code,
                    'blood_component': clean_comp,
                    'current_available_stock': usable_inv,
                    'reserved_stock': reserved_inv,
                    'future_blood_demand': total_expected,
                    'daily_avg_demand': daily_avg,
                    'potential_stock_gap': potential_gap,
                    'safe_amount_to_share': max(0, usable_inv - total_expected),
                    'risk_label': risk_label,
                    'forecast_target': forecast_target,
                    'daily_forecast': daily_forecast
                })
            else:
                other_inv = BloodInventory.objects.filter(
                    facility=facility,
                    blood_group=bg_code,
                    blood_component=clean_comp
                ).first()
                all_bg_predictions.append({
                    'blood_group': bg_code,
                    'blood_component': clean_comp,
                    'current_available_stock': other_inv.available_units if other_inv else 0,
                    'reserved_stock': other_inv.reserved_units if other_inv else 0,
                    'future_blood_demand': 0,
                    'daily_avg_demand': 0.0,
                    'potential_stock_gap': 0,
                    'safe_amount_to_share': other_inv.available_units if other_inv else 0,
                    'risk_label': 'Select group for series',
                    'forecast_target': forecast_target,
                    'daily_forecast': []
                })

        return {
            'status': 'success',
            'facility': {
                'facility_id': facility_id,
                'facility_name': facility.name,
                'facility_type': facility.facility_type,
                'forecast_target': forecast_target,
                'label': facility_label,
                'short_label': short_label,
            },
            'filter': {
                'blood_group': clean_bg,
                'blood_component': clean_comp,
                'days': history_days,
                'forecast_days': horizon
            },
            'available_filters': {
                'blood_groups': available_blood_groups,
                'components': available_components
            },
            # Primary single source of truth for both Expected Demand dropdown and Forecast Graph
            'daily_forecast': daily_forecast,
            'history': history,
            'summary': {
                'total_expected': total_expected,
                'daily_average': daily_avg,
                'peak_day': peak_day,
                'peak_units': peak_units,
                'usable_inventory': usable_inv,
                'reserved_inventory': reserved_inv,
                'in_transit_inventory': in_transit_inv,
                'potential_stock_gap': potential_gap,
                'risk_label': risk_label,
                'forecast_days': horizon
            },
            'predictions': all_bg_predictions,
            'model_info': {
                'model_version': model_version_used or 'facility_forecast_v1',
                'algorithm': 'Predictive AI Regressor',
                'target': forecast_target,
                'features': 'Time features, Lags (1,2,3,7,14,21,28), Rolling Statistics (3,7,14,30)',
                'validation': 'Chronological 15% Holdout with Historical Weekday-Average Benchmark'
            }
        }
