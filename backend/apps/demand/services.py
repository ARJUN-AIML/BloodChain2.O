from apps.inventory.models import BLOOD_GROUPS, BloodInventory

class DemandPredictionService:
    @staticmethod
    def get_future_demand(facility, timeframe='7-day'):
        """
        Service interface for Future Blood Demand Prediction.
        Currently returns structured simulation demand predictions.
        Architecturally designed to easily plug in trained ML models (e.g. XGBoost)
        when original historical datasets are provided.
        """
        multiplier = 1
        if timeframe == '1-day':
            multiplier = 0.2
        elif timeframe == '30-day':
            multiplier = 4.0

        predictions = []
        inventories = {
            inv.blood_group: inv
            for inv in BloodInventory.objects.filter(facility=facility)
        }

        # Base synthetic demand patterns per blood group
        base_demand_map = {
            'O+': 12, 'A+': 10, 'B+': 8, 'AB+': 4,
            'O-': 6,  'A-': 4,  'B-': 3, 'AB-': 2
        }

        safety_reserve = 5

        for bg_code, bg_name in BLOOD_GROUPS:
            inv = inventories.get(bg_code)
            available = inv.available_units if inv else 0
            reserved = inv.reserved_units if inv else 0

            expected_demand = int(round(base_demand_map.get(bg_code, 5) * multiplier))
            total_required = expected_demand + safety_reserve

            possible_shortage = max(0, total_required - available)
            
            # Safe Amount To Share = Available - Expected Requirement - Safety Reserve
            safe_to_share = max(0, available - expected_demand - safety_reserve)

            predictions.append({
                'blood_group': bg_code,
                'current_available_stock': available,
                'reserved_stock': reserved,
                'future_blood_demand': expected_demand,
                'safety_reserve': safety_reserve,
                'possible_shortage': possible_shortage,
                'safe_amount_to_share': safe_to_share,
                'is_low_stock': available < total_required,
                'status_note': 'Sufficient' if possible_shortage == 0 else 'Possible Shortage Warning'
            })

        return {
            'facility_id': facility.facility_id,
            'facility_name': facility.name,
            'timeframe': timeframe,
            'is_simulation_data': True,
            'predictions': predictions
        }
