from django.urls import path
from .views import (
    CreateRequestView,
    SentRequestsListView,
    ReceivedRequestsListView,
    RespondToRequestView
)

urlpatterns = [
    path('', CreateRequestView.as_view(), name='request-create'),
    path('sent/', SentRequestsListView.as_view(), name='requests-sent'),
    path('received/', ReceivedRequestsListView.as_view(), name='requests-received'),
    path('<int:pk>/respond/', RespondToRequestView.as_view(), name='request-respond'),
]
