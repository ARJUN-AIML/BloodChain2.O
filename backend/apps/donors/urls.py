from django.urls import path
from .views import (
    DonorRegisterView, DonorLoginView, DonorMeView,
    DonorQRVerifyView, DonorDonationsView, DonorCertificatesView,
    DonorAchievementsView, DonorRegistrationsView, DonorNotificationsView
)

urlpatterns = [
    path('register/', DonorRegisterView.as_view(), name='donor-register'),
    path('login/', DonorLoginView.as_view(), name='donor-login'),
    path('me/', DonorMeView.as_view(), name='donor-me'),
    path('me/donations/', DonorDonationsView.as_view(), name='donor-donations'),
    path('me/certificates/', DonorCertificatesView.as_view(), name='donor-certificates'),
    path('me/achievements/', DonorAchievementsView.as_view(), name='donor-achievements'),
    path('me/registrations/', DonorRegistrationsView.as_view(), name='donor-registrations'),
    path('me/notifications/', DonorNotificationsView.as_view(), name='donor-notifications'),
    path('qr-verify/<uuid:qr_token>/', DonorQRVerifyView.as_view(), name='donor-qr-verify'),
]
