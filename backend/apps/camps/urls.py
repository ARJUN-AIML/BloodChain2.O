from django.urls import path
from .views import (
    CampListView, CampCreateView, CampDetailView,
    FacilityCampsView, CampRegisterView,
    CampRegistrationsListView, CampCheckInView,
    DonationVerifyView, CertificatePublicVerifyView,
    UnifiedQRVerifyView
)

urlpatterns = [
    path('', CampListView.as_view(), name='camp-list'),
    path('create/', CampCreateView.as_view(), name='camp-create'),
    path('my-facility/', FacilityCampsView.as_view(), name='facility-camps'),
    path('facility_camps/', FacilityCampsView.as_view(), name='facility-camps-alias'),
    path('facility-camps/', FacilityCampsView.as_view(), name='facility-camps-hyphen'),
    path('donations/verify/', DonationVerifyView.as_view(), name='donation-verify'),
    path('<str:camp_id>/register/', CampRegisterView.as_view(), name='camp-register'),
    path('<str:camp_id>/registrations/', CampRegistrationsListView.as_view(), name='camp-registrations'),
    path('<str:camp_id>/check-in/', CampCheckInView.as_view(), name='camp-checkin'),
    path('<str:camp_id>/check_in/', CampCheckInView.as_view(), name='camp-checkin-alias'),
    path('<str:camp_id>/verify_donation/', DonationVerifyView.as_view(), name='camp-verify-donation-alias'),
    path('<str:camp_id>/verify-donation/', DonationVerifyView.as_view(), name='camp-verify-donation-hyphen'),
    path('certificates/verify/<uuid:qr_token>/', CertificatePublicVerifyView.as_view(), name='cert-verify'),
    path('verify/<str:token>/', UnifiedQRVerifyView.as_view(), name='unified-qr-verify-camp'),
    path('<str:camp_id>/', CampDetailView.as_view(), name='camp-detail'),
]
