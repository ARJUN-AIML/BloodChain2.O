import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth.models import User
from apps.accounts.models import UserProfile
from apps.facilities.models import Facility
from apps.demand.models import DemandPrediction

def run_tests():
    facilities = [
        ('ch_h_01', 'HOSPITAL', 'units_requested', 'Hospital Blood Demand Forecast'),
        ('ch_h_02', 'HOSPITAL', 'units_requested', 'Hospital Blood Demand Forecast'),
        ('ma_b_01', 'BLOOD_BANK', 'units_transferred_out', 'Blood Bank Outbound Requirement Forecast'),
        ('ch_b_01', 'BLOOD_BANK', 'units_transferred_out', 'Blood Bank Outbound Requirement Forecast'),
    ]

    components = ['RBC', 'WBC', 'Platelets']
    all_passed = True

    print("=" * 70)
    print("END-TO-END ML DEMAND / OUTBOUND REQUIREMENT FORECAST VERIFICATION")
    print("=" * 70)

    for fid, role, expected_target, expected_label in facilities:
        user, _ = User.objects.get_or_create(username=f'test_user_{fid}')
        fac = Facility.objects.filter(facility_id=fid).first()
        if not fac:
            print(f"[FAIL] Facility {fid} not found in database!")
            all_passed = False
            continue

        UserProfile.objects.update_or_create(
            user=user,
            defaults={
                'facility': fac,
                'role': role,
                'firebase_uid': f'uid-{fid}',
                'is_active': True
            }
        )

        client = APIClient()
        client.force_authenticate(user=user)

        print(f"\nFacility: {fid} ({fac.name})")
        print(f"Role: {role} | Target: {expected_target} | Label: {expected_label}")
        print("-" * 70)

        for comp in components:
            res = client.get(f'/api/demand/?blood_group=O%2B&component={comp}')
            if res.status_code != 200:
                print(f"  [FAIL] {comp}: Status code {res.status_code}")
                all_passed = False
                continue

            data = res.data
            target = data.get('facility', {}).get('forecast_target')
            label = data.get('facility', {}).get('label')
            daily_forecast = data.get('daily_forecast', [])
            history = data.get('history', [])
            summary = data.get('summary', {})
            db_stored = DemandPrediction.objects.filter(
                facility_id=fid,
                forecast_target=expected_target,
                blood_group='O+',
                blood_component=comp
            ).count()

            # Consistency check
            assert target == expected_target, f"Target mismatch: {target} != {expected_target}"
            assert label == expected_label, f"Label mismatch: {label} != {expected_label}"
            assert len(daily_forecast) == 7, f"Expected 7 future days, got {len(daily_forecast)}"
            assert len(history) > 0, "No historical actuals returned"

            pred_units = [p['predicted_units'] for p in daily_forecast]
            total_sum = round(sum(pred_units), 1)
            assert total_sum == summary['total_expected'], f"Sum mismatch: {total_sum} != {summary['total_expected']}"

            print(f"  [PASS] O+ {comp:<9} | Target: {target} | 7-Day Preds: {pred_units} | Sum: {total_sum} | DB Records: {db_stored}")

        # Security check: verify this facility cannot query another facility's forecast
        other_fid = 'ch_b_01' if fid != 'ch_b_01' else 'ch_h_01'
        sec_res = client.get(f'/api/demand/?facility_id={other_fid}')
        assert sec_res.status_code == 403, f"Security isolation failed for {fid} -> {other_fid} (got {sec_res.status_code})"
        print(f"  [PASS] Security Check: {fid} querying {other_fid} -> 403 Forbidden (Isolated)")

    print("\n" + "=" * 70)
    print(f"ALL END-TO-END TESTS PASSED: {all_passed}")
    print("=" * 70)

if __name__ == '__main__':
    run_tests()
