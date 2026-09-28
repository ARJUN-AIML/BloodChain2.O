from django.urls import path
from .views import InventoryListView, ExpiryAlertsView, FacilityDailyRecordListView, BloodComponentAnalyticsView

urlpatterns = [
    path('', InventoryListView.as_view(), name='inventory-list'),
    path('expiry-alerts/', ExpiryAlertsView.as_view(), name='inventory-expiry-alerts'),
    path('daily-records/', FacilityDailyRecordListView.as_view(), name='facility-daily-records'),
    path('component-analytics/', BloodComponentAnalyticsView.as_view(), name='blood-component-analytics'),
]

