from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/facilities/', include('apps.facilities.urls')),
    path('api/inventory/', include('apps.inventory.urls')),
    path('api/requests/', include('apps.requests.urls')),
    path('api/transfers/', include('apps.transfers.urls')),
    path('api/demand/', include('apps.demand.urls')),
    path('api/audit/', include('apps.audit.urls')),
    path('api/donors/', include('apps.donors.urls')),
    path('api/camps/', include('apps.camps.urls')),
]
