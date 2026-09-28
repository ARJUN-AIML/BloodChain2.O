from rest_framework import views, permissions, response
from .services import DemandPredictionService

class DemandPredictionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.facility:
            return response.Response({'detail': 'User facility required'}, status=400)

        timeframe = request.query_params.get('timeframe', '7-day')
        data = DemandPredictionService.get_future_demand(profile.facility, timeframe=timeframe)
        return response.Response(data)

class SafeToShareView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.facility:
            return response.Response({'detail': 'User facility required'}, status=400)

        demand_data = DemandPredictionService.get_future_demand(profile.facility, timeframe='7-day')
        safe_list = [
            {
                'blood_group': item['blood_group'],
                'available': item['current_available_stock'],
                'safe_amount_to_share': item['safe_amount_to_share']
            }
            for item in demand_data['predictions']
        ]

        return response.Response({
            'facility_id': profile.facility.facility_id,
            'facility_name': profile.facility.name,
            'safe_to_share': safe_list
        })
