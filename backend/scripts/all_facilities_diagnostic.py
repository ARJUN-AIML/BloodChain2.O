import os
import sys
import django

# Set up Django environment
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.facilities.models import Facility
from apps.inventory.models import FacilityDailyRecord
from apps.demand.models import DemandPrediction
from apps.demand.services import DemandPredictionService

def run_all_facilities_diagnostic():
    print("=" * 110)
    print("BLOODCHAIN PORTAL-V2: ALL-FACILITY ML FORECAST DIAGNOSTIC AUDIT")
    print("=" * 110)
    
    facilities = list(Facility.objects.all().order_by('facility_type', 'facility_id'))
    print(f"Total Facilities Found in PostgreSQL: {len(facilities)}")
    
    summary_counts = {
        'total_facilities': len(facilities),
        'hospitals': 0,
        'blood_banks': 0,
        'checked_combinations': 0,
        'sufficient_data_with_predictions': 0,
        'insufficient_data': 0,
        'errors': 0
    }
    
    results = []
    
    print("\nAuditing sample series (O+ RBC) for all facilities:")
    print(f"{'Facility ID':<12} | {'Type':<10} | {'Grp':<4} | {'Comp':<10} | {'Hist':<6} | {'Target':<22} | {'Preds':<5} | {'7d Tot':<8} | {'Daily':<6} | {'Status':<15}")
    print("-" * 110)
    
    for f in facilities:
        ftype = (f.facility_type or '').upper()
        if 'HOSP' in ftype:
            summary_counts['hospitals'] += 1
            expected_target = 'units_requested'
        else:
            summary_counts['blood_banks'] += 1
            expected_target = 'units_transferred_out'
            
        bg = 'O+'
        comp = 'RBC'
        
        # Check historical rows in FacilityDailyRecord
        hist_count = FacilityDailyRecord.objects.filter(
            facility_id=f.facility_id,
            blood_group=bg,
            blood_component=comp
        ).count()
        
        try:
            data = DemandPredictionService.get_forecast_data(
                facility=f,
                blood_group=bg,
                blood_component=comp
            )
            
            daily_forecast = data.get('daily_forecast', [])
            pred_count = len(daily_forecast)
            summary = data.get('summary', {})
            risk_label = summary.get('risk_label', 'UNKNOWN')
            actual_target = data.get('facility', {}).get('forecast_target', '')
            total_exp = summary.get('total_expected', 0)
            daily_avg = summary.get('daily_average', 0)
            
            summary_counts['checked_combinations'] += 1
            
            if pred_count >= 7:
                status = "OK"
                summary_counts['sufficient_data_with_predictions'] += 1
            elif risk_label == 'Insufficient Data' or 'insufficient' in str(data.get('status_note', '')).lower():
                status = "INSUFFICIENT"
                summary_counts['insufficient_data'] += 1
            else:
                status = f"MISSING ({pred_count})"
                summary_counts['errors'] += 1
                
            tot_str = f"{total_exp:.1f}" if isinstance(total_exp, (int, float)) else str(total_exp)
            avg_str = f"{daily_avg:.1f}" if isinstance(daily_avg, (int, float)) else str(daily_avg)
            
            print(f"{f.facility_id:<12} | {ftype[:10]:<10} | {bg:<4} | {comp:<10} | {hist_count:<6} | {actual_target:<22} | {pred_count:<5} | {tot_str:<8} | {avg_str:<6} | {status:<15}")
            
            results.append({
                'facility_id': f.facility_id,
                'facility_name': f.name,
                'type': ftype,
                'target': actual_target,
                'hist_count': hist_count,
                'pred_count': pred_count,
                'status': status,
                'total_expected': total_exp,
                'daily_average': daily_avg,
            })
            
        except Exception as e:
            summary_counts['errors'] += 1
            print(f"{f.facility_id:<12} | {ftype[:10]:<10} | {bg:<4} | {comp:<10} | {hist_count:<6} | {expected_target:<22} | 0     | N/A      | N/A    | ERROR: {str(e)[:20]}")
            
    print("=" * 110)
    print("DIAGNOSTIC SUMMARY:")
    print(f"Total facilities: {summary_counts['total_facilities']} (Hospitals: {summary_counts['hospitals']}, Blood Banks: {summary_counts['blood_banks']})")
    print(f"Combinations tested: {summary_counts['checked_combinations']}")
    print(f"Sufficient data & active 7-day predictions: {summary_counts['sufficient_data_with_predictions']}")
    print(f"Insufficient data combinations: {summary_counts['insufficient_data']}")
    print(f"Errors: {summary_counts['errors']}")
    print("=" * 110)

if __name__ == '__main__':
    run_all_facilities_diagnostic()
