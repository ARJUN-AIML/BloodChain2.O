from django.urls import path
from .views import DemandPredictionView, SafeToShareView

urlpatterns = [
    path('', DemandPredictionView.as_view(), name='demand-prediction'),
    path('safe-to-share/', SafeToShareView.as_view(), name='demand-safe-to-share'),
]
