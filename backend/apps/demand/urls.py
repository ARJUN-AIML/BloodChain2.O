from django.urls import path
from .views import DemandPredictionView, TriggerForecastView, SafeToShareView

urlpatterns = [
    path('', DemandPredictionView.as_view(), name='demand-prediction'),
    path('trigger-forecast/', TriggerForecastView.as_view(), name='demand-trigger-forecast'),
    path('safe-to-share/', SafeToShareView.as_view(), name='demand-safe-to-share'),
]
