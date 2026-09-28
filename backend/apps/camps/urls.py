from django.urls import path
from .views import (
    CampListView, CampCreateView, CampDetailView,
    FacilityCampsView, CampRegisterView,
    CampRegistrationsListView, CampCheckInView,
    DonationVerifyView, CertificatePublicVerifyView
)

urlpatterns = [
    path('', CampListView.as_view(), name='camp-list'),
    path('create/', CampCreateView.as_view(), name='camp-create'),
    path('my-facility/', FacilityCampsView.as_view(), name='facility-camps'),
    path('<str:camp_id>/', CampDetailView.as_view(), name='camp-detail'),
    path('<str:camp_id>/register/', CampRegisterView.as_view(), name='camp-register'),
    path('<str:camp_id>/registrations/', CampRegistrationsListView.as_view(), name='camp-registrations'),
    path('<str:camp_id>/check-in/', CampCheckInView.as_view(), name='camp-checkin'),
    path('donations/verify/', DonationVerifyView.as_view(), name='donation-verify'),
    path('certificates/verify/<uuid:qr_token>/', CertificatePublicVerifyView.as_view(), name='cert-verify'),
]
