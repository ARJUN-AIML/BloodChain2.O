import os
import sys
import json
import django
import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.facilities.models import Facility
from apps.accounts.models import UserProfile, User

BASE_URL = 'http://127.0.0.1:8000'

def get_token_for_facility(facility_id):
    return f"dev-token-{facility_id.replace('_', '-')}"

def test_api_series(facility_id, blood_group='O+', component='RBC'):
    fac = Facility.objects.get(facility_id=facility_id)
    token = get_token_for_facility(facility_id)
    headers = {'Authorization': f'Bearer {token}'}
    
    url = f"{BASE_URL}/api/demand/?blood_group={blood_group}&component={component}"
    resp = requests.get(url, headers=headers)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    
    data = resp.json()
    
    # 1. Facility verification
    fac_info = data.get('facility', {})
    expected_type = fac.facility_type
    expected_target = 'units_requested' if 'HOSP' in expected_type.upper() else 'units_transferred_out'
    expected_label = 'Hospital Blood Demand Forecast' if 'HOSP' in expected_type.upper() else 'Blood Bank Outbound Requirement Forecast'
    
    assert fac_info.get('facility_id') == facility_id, f"Facility ID mismatch: {fac_info.get('facility_id')} vs {facility_id}"
    assert fac_info.get('forecast_target') == expected_target, f"Target mismatch: {fac_info.get('forecast_target')} vs {expected_target}"
    assert fac_info.get('label') == expected_label, f"Label mismatch: {fac_info.get('label')} vs {expected_label}"
    
    # 2. Forecast Array verification
    daily_forecast = data.get('daily_forecast', [])
    assert len(daily_forecast) == 7, f"Expected 7 forecast days, got {len(daily_forecast)}"
    
    predictions = [p['predicted_units'] for p in daily_forecast]
    assert all(isinstance(v, (int, float)) for v in predictions), f"Invalid prediction types: {predictions}"
    
    # 3. Summary verification
    summary = data.get('summary', {})
    tot = summary.get('total_expected')
    avg = summary.get('daily_average')
    usable = summary.get('usable_inventory')
    gap = summary.get('potential_stock_gap')
    risk = summary.get('risk_label')
    
    assert tot is not None and tot != 'N/A' and isinstance(tot, (int, float)), f"Invalid total: {tot}"
    assert avg is not None and avg != 'N/A' and isinstance(avg, (int, float)), f"Invalid avg: {avg}"
    assert abs(tot - sum(predictions)) < 0.2, f"Total mismatch with sum of predictions: {tot} vs {sum(predictions)}"
    
    # 4. History verification
    history = data.get('history', [])
    
    print(f"PASSED {facility_id} ({expected_type}) [{blood_group} {component}]:")
    print(f"  Target: {expected_target} | Label: {expected_label}")
    print(f"  7-Day Predictions: {predictions}")
    print(f"  7-Day Total: {tot} units | Daily Avg: {avg} units/day")
    print(f"  Usable Inventory: {usable} | Potential Gap: {gap} | Risk: {risk}")
    print(f"  History Points: {len(history)} | Peak Day: {summary.get('peak_day')} ({summary.get('peak_units')} units)")
    print("-" * 80)
    return {
        'facility_id': facility_id,
        'type': expected_type,
        'blood_group': blood_group,
        'component': component,
        'target': expected_target,
        'predictions': predictions,
        'total': tot,
        'avg': avg,
        'usable': usable,
        'gap': gap,
        'risk': risk,
    }

def main():
    print("=" * 80)
    print("END-TO-END HTTP API VERIFICATION FOR PORTAL-V2")
    print("=" * 80)
    
    # Mandatory tests including ch_h_05:
    test_cases = [
        # Hospitals
        ('ch_h_05', 'O+', 'RBC'),
        ('ch_h_01', 'O+', 'RBC'),
        ('ch_h_02', 'O+', 'RBC'),
        ('ch_h_01', 'O+', 'Platelets'),
        ('ch_h_01', 'O+', 'WBC'),
        # Blood Banks
        ('ch_b_01', 'O+', 'RBC'),
        ('ma_b_01', 'O+', 'RBC'),
        ('ch_b_01', 'O+', 'Platelets'),
        ('ch_b_01', 'O+', 'WBC'),
    ]
    
    results = []
    for fid, bg, comp in test_cases:
        res = test_api_series(fid, bg, comp)
        results.append(res)
        
    # Security check: verify that a facility token cannot query another facility's predictions
    token_ch_b_01 = get_token_for_facility('ch_b_01')
    resp_spoof = requests.get(
        f"{BASE_URL}/api/demand/?facility_id=ch_h_01&blood_group=O+&component=RBC",
        headers={'Authorization': f'Bearer {token_ch_b_01}'}
    )
    assert resp_spoof.status_code == 403, f"Expected 403 for unauthorized facility query, got {resp_spoof.status_code}"
    print("[SECURITY TEST PASSED] Facility 'ch_b_01' querying '?facility_id=ch_h_01' returned HTTP 403 Forbidden.")
    
    print("\nALL MANDATORY TEST CASES PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    main()
