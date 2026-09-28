from django.urls import path
from .views import (
    IncomingTransfersListView,
    OutgoingTransfersListView,
    ApproveTransferView,
    DispatchTransferView,
    GenerateOTPView,
    VerifyOTPView
)

urlpatterns = [
    path('incoming/', IncomingTransfersListView.as_view(), name='transfers-incoming'),
    path('outgoing/', OutgoingTransfersListView.as_view(), name='transfers-outgoing'),
    path('<int:pk>/approve/', ApproveTransferView.as_view(), name='transfer-approve'),
    path('<int:pk>/dispatch/', DispatchTransferView.as_view(), name='transfer-dispatch'),
    path('<int:pk>/generate-otp/', GenerateOTPView.as_view(), name='transfer-generate-otp'),
    path('<int:pk>/verify-otp/', VerifyOTPView.as_view(), name='transfer-verify-otp'),
]
