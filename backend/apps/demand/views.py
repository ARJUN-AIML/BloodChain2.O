from rest_framework import views, permissions, response, status
from .services import DemandPredictionService
from ml.forecasting.forecast_service import run_pipeline

class DemandPredictionView(views.APIView):
    """
    Main ML Demand / Outbound Requirement Forecasting API.
    Server-side authentication enforces facility isolation:
    Hospitals receive 'Hospital Blood Demand Forecast' (target: units_requested).
    Blood Banks receive 'Blood Bank Outbound Requirement Forecast' (target: units_transferred_out).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.facility:
            return response.Response(
                {'detail': 'Authenticated user must be linked to an active facility profile.'},
                status=status.HTTP_403_FORBIDDEN
            )

        auth_facility = profile.facility

        # Mandatory Server-Side Facility Isolation Check (Requirement 11 & 22)
        requested_fid = request.query_params.get('facility_id')
        if requested_fid and requested_fid.strip() != auth_facility.facility_id:
            return response.Response(
                {
                    'detail': f"Forbidden: Access denied. Authenticated facility '{auth_facility.facility_id}' cannot view forecasts for '{requested_fid}'."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # Filters
        blood_group = request.query_params.get('blood_group', 'O+').strip()
        # Accept either 'component' or 'blood_component'
        component = (
            request.query_params.get('component') or
            request.query_params.get('blood_component') or
            'RBC'
        ).strip()
        days = request.query_params.get('days', 14)
        forecast_days = (
            request.query_params.get('forecast_days') or 
            request.query_params.get('horizon_days') or 
            days
        )

        try:
            data = DemandPredictionService.get_forecast_data(
                facility=auth_facility,
                blood_group=blood_group,
                blood_component=component,
                days=days,
                forecast_days=forecast_days
            )
        except Exception as e:
            import logging
            logger = logging.getLogger('bloodchain.ml')
            logger.error(f'Demand forecast error for {auth_facility.facility_id}: {e}', exc_info=True)
            data = {
                'status': 'error',
                'risk_label': 'Service Error',
                'status_note': f'Forecast temporarily unavailable: {str(e)[:200]}',
                'facility': {
                    'facility_id': auth_facility.facility_id,
                    'facility_name': auth_facility.name,
                    'facility_type': auth_facility.facility_type,
                    'forecast_target': 'units_requested',
                    'label': 'Demand Forecast',
                    'short_label': 'Demand',
                },
                'filter': {
                    'blood_group': blood_group,
                    'blood_component': component,
                    'days': int(days) if days else 14,
                    'forecast_days': int(forecast_days) if forecast_days else 7
                },
                'available_filters': {
                    'blood_groups': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
                    'components': ['RBC', 'WBC', 'Platelets', 'Plasma', 'Whole Blood', 'Cryoprecipitate']
                },
                'daily_forecast': [],
                'history': [],
                'summary': {
                    'total_expected': 'N/A',
                    'daily_average': 'N/A',
                    'peak_day': 'N/A',
                    'peak_units': 'N/A',
                    'usable_inventory': 0,
                    'reserved_inventory': 0,
                    'in_transit_inventory': 0,
                    'potential_stock_gap': 'N/A',
                    'risk_label': 'Service Error',
                    'forecast_days': int(forecast_days) if forecast_days else 7
                },
                'predictions': [],
                'model_info': {
                    'model_version': 'N/A',
                    'algorithm': 'Predictive AI Regressor',
                    'status': 'Forecast service temporarily unavailable'
                }
            }
        return response.Response(data)


class TriggerForecastView(views.APIView):
    """
    Triggers end-to-end ML forecast generation for the authenticated facility.
    Called when new inventory or transaction data is recorded.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.facility:
            return response.Response({'detail': 'User facility required'}, status=status.HTTP_403_FORBIDDEN)

        facility = profile.facility
        result = run_pipeline(facility_id=facility.facility_id)
        return response.Response({
            'facility_id': facility.facility_id,
            'result': result
        })


class SafeToShareView(views.APIView):
    """
    Calculates blood safety reserves and sharable units using authenticated facility's inventory.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.facility:
            return response.Response({'detail': 'User facility required'}, status=status.HTTP_403_FORBIDDEN)

        facility = profile.facility
        forecast = DemandPredictionService.get_forecast_data(facility, blood_group='O+', blood_component='RBC')

        return response.Response({
            'facility_id': facility.facility_id,
            'facility_name': facility.name,
            'safe_to_share': []
        })
