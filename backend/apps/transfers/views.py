import random
import hashlib
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from rest_framework import generics, permissions, status, response, views

from .models import BloodTransfer
from .serializers import BloodTransferSerializer, VerifyOTPSerializer
from apps.inventory.models import BloodInventory
from apps.audit.models import AuditLog
from apps.accounts.permissions import IsHospitalApproval, IsHospitalLogistics

class IncomingTransfersListView(generics.ListAPIView):
    serializer_class = BloodTransferSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        profile = getattr(self.request.user, 'profile', None)
        if not profile or not profile.facility:
            return BloodTransfer.objects.none()
        return BloodTransfer.objects.filter(receiver_facility=profile.facility)

class OutgoingTransfersListView(generics.ListAPIView):
    serializer_class = BloodTransferSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        profile = getattr(self.request.user, 'profile', None)
        if not profile or not profile.facility:
            return BloodTransfer.objects.none()
        return BloodTransfer.objects.filter(sender_facility=profile.facility)

class ApproveTransferView(views.APIView):
    """Approval Desk action: Authorizes transfer and reserves sender inventory."""
    permission_classes = [permissions.IsAuthenticated, IsHospitalApproval]

    @transaction.atomic
    def post(self, request, pk):
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.facility:
            return response.Response({'detail': 'User facility required'}, status=400)

        if profile.role == 'HOSPITAL_LOGISTICS':
            return response.Response({'detail': 'Logistics officers are NOT authorized to approve transfers. Use the Approval Desk.'}, status=403)

        try:
            transfer = BloodTransfer.objects.select_for_update().get(pk=pk, sender_facility=profile.facility)
        except BloodTransfer.DoesNotExist:
            return response.Response({'detail': 'Transfer not found or unauthorized'}, status=404)

        if transfer.status != 'CREATED':
            return response.Response({'detail': f'Cannot approve transfer in status {transfer.status}'}, status=400)

        # Reserve Sender Stock
        inv, _ = BloodInventory.objects.select_for_update().get_or_create(
            facility=profile.facility,
            blood_group=transfer.blood_group
        )

        if inv.available_units < transfer.quantity:
            return response.Response({
                'detail': f'Insufficient available inventory. Required: {transfer.quantity}, Available: {inv.available_units}'
            }, status=400)

        inv.available_units -= transfer.quantity
        inv.reserved_units += transfer.quantity
        inv.save()

        transfer.status = 'APPROVED'
        transfer.approved_at = timezone.now()
        transfer.save()

        AuditLog.objects.create(
            user=request.user,
            facility=profile.facility,
            action="APPROVED_TRANSFER",
            object_type="BloodTransfer",
            object_id=transfer.transfer_id,
            previous_status="CREATED",
            new_status="APPROVED",
            details=f"Approval Desk authorized transfer {transfer.transfer_id}. Reserved {transfer.quantity} units of {transfer.blood_group}. Handoff to Logistics."
        )

        return response.Response({'detail': 'Transfer approved and stock reserved. Ready for Logistics dispatch.', 'transfer': BloodTransferSerializer(transfer).data})

class DispatchTransferView(views.APIView):
    """Logistics Desk action: Dispatches approved transfer and moves stock to in-transit."""
    permission_classes = [permissions.IsAuthenticated, IsHospitalLogistics]

    @transaction.atomic
    def post(self, request, pk):
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.facility:
            return response.Response({'detail': 'User facility required'}, status=400)

        if profile.role == 'HOSPITAL_APPROVAL':
            return response.Response({'detail': 'Approval Desk users cannot dispatch blood directly. Use the Logistics Desk.'}, status=403)

        try:
            transfer = BloodTransfer.objects.select_for_update().get(pk=pk, sender_facility=profile.facility)
        except BloodTransfer.DoesNotExist:
            return response.Response({'detail': 'Transfer not found or unauthorized'}, status=404)

        if transfer.status != 'APPROVED':
            return response.Response({'detail': f'Cannot dispatch transfer in status {transfer.status}. Must be APPROVED first.'}, status=400)

        # Transition Reserved -> In Transit
        inv = BloodInventory.objects.select_for_update().get(
            facility=profile.facility,
            blood_group=transfer.blood_group
        )

        if inv.reserved_units < transfer.quantity:
            return response.Response({'detail': 'Inconsistent reserved inventory state'}, status=400)

        inv.reserved_units -= transfer.quantity
        inv.in_transit_units += transfer.quantity
        inv.save()

        transfer.status = 'DISPATCHED'
        transfer.dispatched_at = timezone.now()
        transfer.save()

        AuditLog.objects.create(
            user=request.user,
            facility=profile.facility,
            action="DISPATCHED_TRANSFER",
            object_type="BloodTransfer",
            object_id=transfer.transfer_id,
            previous_status="APPROVED",
            new_status="DISPATCHED",
            details=f"Logistics Officer dispatched shipment {transfer.transfer_id}. Moved {transfer.quantity} units to In-Transit."
        )

        return response.Response({'detail': 'Transfer dispatched successfully. Shipment is now In-Transit.', 'transfer': BloodTransferSerializer(transfer).data})

class GenerateOTPView(views.APIView):
    """Logistics Desk action (Receiver): Generates single-use OTP for arriving shipment."""
    permission_classes = [permissions.IsAuthenticated, IsHospitalLogistics]

    @transaction.atomic
    def post(self, request, pk):
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.facility:
            return response.Response({'detail': 'User facility required'}, status=400)

        try:
            transfer = BloodTransfer.objects.select_for_update().get(pk=pk, receiver_facility=profile.facility)
        except BloodTransfer.DoesNotExist:
            return response.Response({'detail': 'Transfer not found or unauthorized'}, status=404)

        if transfer.status not in ['DISPATCHED', 'OTP_PENDING']:
            return response.Response({'detail': f'Cannot generate OTP for transfer in status {transfer.status}'}, status=400)

        otp_code = f"{random.randint(100000, 999999)}"
        otp_hash = hashlib.sha256(otp_code.encode('utf-8')).hexdigest()

        transfer.otp_code_hash = otp_hash
        transfer.otp_created_at = timezone.now()
        transfer.otp_attempts = 0
        transfer.status = 'OTP_PENDING'
        transfer.save()

        AuditLog.objects.create(
            user=request.user,
            facility=profile.facility,
            action="GENERATED_RECEIVING_OTP",
            object_type="BloodTransfer",
            object_id=transfer.transfer_id,
            new_status="OTP_PENDING",
            details=f"Logistics Officer at receiving facility generated 6-digit handshake OTP for shipment {transfer.transfer_id}."
        )

        return response.Response({
            'detail': 'OTP generated successfully',
            'transfer_id': transfer.transfer_id,
            'otp_code': otp_code,
            'expires_in_seconds': 600
        })

class VerifyOTPView(views.APIView):
    """Logistics Desk action (Sender): Verifies OTP entered by sender and completes transfer atomically."""
    permission_classes = [permissions.IsAuthenticated, IsHospitalLogistics]

    @transaction.atomic
    def post(self, request, pk):
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.facility:
            return response.Response({'detail': 'User facility required'}, status=400)

        try:
            transfer = BloodTransfer.objects.select_for_update().get(pk=pk, sender_facility=profile.facility)
        except BloodTransfer.DoesNotExist:
            return response.Response({'detail': 'Transfer not found or unauthorized'}, status=404)

        # Idempotency Protection
        if transfer.status == 'COMPLETED':
            return response.Response({'detail': 'Transfer has already been completed.', 'transfer': BloodTransferSerializer(transfer).data}, status=200)

        if transfer.status != 'OTP_PENDING':
            return response.Response({'detail': f'Cannot verify OTP for transfer in status {transfer.status}'}, status=400)

        otp_input = request.data.get('otp_code', '').strip()
        if not otp_input:
            return response.Response({'detail': 'OTP code required'}, status=400)

        # Validate Expiry (10 mins)
        if not transfer.otp_created_at or (timezone.now() - transfer.otp_created_at) > timedelta(minutes=10):
            return response.Response({'detail': 'OTP code has expired. Receiver must generate a new OTP.'}, status=400)

        # Validate Attempt Limit
        if transfer.otp_attempts >= 5:
            return response.Response({'detail': 'Maximum OTP attempt limit reached. Generate new OTP.'}, status=400)

        input_hash = hashlib.sha256(otp_input.encode('utf-8')).hexdigest()
        if input_hash != transfer.otp_code_hash:
            transfer.otp_attempts += 1
            transfer.save()
            return response.Response({'detail': f'Invalid OTP code. Attempts remaining: {5 - transfer.otp_attempts}'}, status=400)

        # Atomic Inventory Transition
        # 1. Sender: in_transit_units -= qty
        sender_inv = BloodInventory.objects.select_for_update().get(
            facility=transfer.sender_facility,
            blood_group=transfer.blood_group
        )
        sender_inv.in_transit_units = max(0, sender_inv.in_transit_units - transfer.quantity)
        sender_inv.save()

        # 2. Receiver: available_units += qty
        receiver_inv, _ = BloodInventory.objects.select_for_update().get_or_create(
            facility=transfer.receiver_facility,
            blood_group=transfer.blood_group
        )
        receiver_inv.available_units += transfer.quantity
        receiver_inv.save()

        # Mark Transfer Completed
        transfer.status = 'COMPLETED'
        transfer.completed_at = timezone.now()
        transfer.save()

        # Audit Record
        AuditLog.objects.create(
            user=request.user,
            facility=profile.facility,
            action="COMPLETED_TRANSFER_VIA_OTP",
            object_type="BloodTransfer",
            object_id=transfer.transfer_id,
            previous_status="OTP_PENDING",
            new_status="COMPLETED",
            details=f"Logistics Officer verified OTP and completed shipment {transfer.transfer_id}. Transferred {transfer.quantity} units of {transfer.blood_group}."
        )

        return response.Response({
            'detail': 'OTP verified successfully. Transfer COMPLETED and inventory updated atomically.',
            'transfer': BloodTransferSerializer(transfer).data
        })
