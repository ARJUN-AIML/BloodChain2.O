from django.urls import path
from .views import InventoryListView, ExpiryAlertsView

urlpatterns = [
    path('', InventoryListView.as_view(), name='inventory-list'),
    path('expiry-alerts/', ExpiryAlertsView.as_view(), name='inventory-expiry-alerts'),
]
