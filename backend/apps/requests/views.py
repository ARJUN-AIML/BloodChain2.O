import uuid
from django.db import transaction
from rest_framework import generics, permissions, status, response, views
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import BloodRequest, RequestAllocation
from .serializers import (
    BloodRequestSerializer,
    CreateBloodRequestSerializer,
    RespondToRequestSerializer,
    RequestAllocationSerializer
)
from apps.accounts.permissions import IsHospitalApproval, IsHospital
from apps.audit.models import AuditLog

class CreateRequestView(generics.CreateAPIView):
    serializer_class = CreateBloodRequestSerializer
    permission_classes = [permissions.IsAuthenticated, IsHospitalApproval]

    def perform_create(self, serializer):
        profile = self.request.user.profile
        facility = profile.facility

        if profile.role == 'HOSPITAL_LOGISTICS':
            raise PermissionDenied("Hospital Logistics officers are NOT authorized to create blood requests. Use the Approval Desk.")

        # Secondary check for Blood Bank restriction
        if facility.facility_type == 'BLOOD_BANK':
            raise PermissionDenied("Blood Banks are NOT permitted to request blood.")

        req_id = f"REQ-{uuid.uuid4().hex[:8].upper()}"
        blood_request = serializer.save(
            request_id=req_id,
            requesting_facility=facility,
            created_by=self.request.user
        )

        # Record Audit
        AuditLog.objects.create(
            user=self.request.user,
            facility=facility,
            action="CREATED_BLOOD_REQUEST",
            object_type="BloodRequest",
            object_id=blood_request.request_id,
            new_status=blood_request.status,
            details=f"Approval Desk created request for {blood_request.requested_quantity} units of {blood_request.blood_group}"
        )

class SentRequestsListView(generics.ListAPIView):
    serializer_class = BloodRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        profile = getattr(self.request.user, 'profile', None)
        if not profile or not profile.facility:
            return BloodRequest.objects.none()
        return BloodRequest.objects.filter(requesting_facility=profile.facility)

class ReceivedRequestsListView(generics.ListAPIView):
    serializer_class = BloodRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        profile = getattr(self.request.user, 'profile', None)
        if not profile or not profile.facility:
            return BloodRequest.objects.none()

        return BloodRequest.objects.exclude(
            requesting_facility=profile.facility
        ).filter(
            status__in=['PENDING_APPROVAL', 'PARTIALLY_FULFILLED', 'ACCEPTED']
        )

class RespondToRequestView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsHospitalApproval]

    @transaction.atomic
    def post(self, request, pk):
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.facility:
            return response.Response({'detail': 'User facility required'}, status=400)

        if profile.role == 'HOSPITAL_LOGISTICS':
            return response.Response({'detail': 'Logistics officers are NOT authorized to accept or reject requests.'}, status=403)

        try:
            blood_request = BloodRequest.objects.select_for_update().get(pk=pk)
        except BloodRequest.DoesNotExist:
            return response.Response({'detail': 'Request not found'}, status=404)

        if blood_request.requesting_facility == profile.facility:
            return response.Response({'detail': 'Cannot respond to your own facility request'}, status=400)

        if blood_request.status in ['FULFILLED', 'CANCELLED', 'REJECTED']:
            return response.Response({'detail': f'Cannot respond to request with status {blood_request.status}'}, status=400)

        serializer = RespondToRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        offered_qty = serializer.validated_data['offered_quantity']
        remaining_qty = blood_request.remaining_quantity

        if remaining_qty <= 0:
            return response.Response({'detail': 'Request is already fully fulfilled'}, status=400)

        accepted_qty = min(offered_qty, remaining_qty)

        alloc_id = f"ALLOC-{uuid.uuid4().hex[:8].upper()}"
        allocation = RequestAllocation.objects.create(
            allocation_id=alloc_id,
            request=blood_request,
            responding_facility=profile.facility,
            offered_quantity=offered_qty,
            accepted_quantity=accepted_qty,
            status='ACCEPTED',
            responded_by=request.user
        )

        blood_request.fulfilled_quantity += accepted_qty
        if blood_request.fulfilled_quantity >= blood_request.requested_quantity:
            blood_request.status = 'FULFILLED'
        else:
            blood_request.status = 'PARTIALLY_FULFILLED'
        blood_request.save()

        # Automatically create BloodTransfer in CREATED state
        from apps.transfers.models import BloodTransfer
        transfer_id = f"TR-{uuid.uuid4().hex[:8].upper()}"
        transfer = BloodTransfer.objects.create(
            transfer_id=transfer_id,
            request=blood_request,
            request_allocation=allocation,
            sender_facility=profile.facility,
            receiver_facility=blood_request.requesting_facility,
            blood_group=blood_request.blood_group,
            quantity=accepted_qty,
            status='CREATED'
        )

        AuditLog.objects.create(
            user=request.user,
            facility=profile.facility,
            action="ACCEPTED_BLOOD_REQUEST",
            object_type="RequestAllocation",
            object_id=allocation.allocation_id,
            new_status=allocation.status,
            details=f"Approval Desk accepted {accepted_qty} units for request {blood_request.request_id}. Transfer {transfer.transfer_id} created."
        )

        return response.Response({
            'detail': 'Request allocation accepted and transfer created',
            'allocation': RequestAllocationSerializer(allocation).data,
            'transfer_id': transfer.transfer_id,
            'request_status': blood_request.status
        }, status=status.HTTP_201_CREATED)
