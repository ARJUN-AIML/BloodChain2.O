from django.db import models
from apps.facilities.models import Facility
from apps.requests.models import BloodRequest, RequestAllocation
from apps.inventory.models import BLOOD_GROUPS

class BloodTransfer(models.Model):
    STATUS_CHOICES = [
        ('CREATED', 'Created'),
        ('APPROVAL_PENDING', 'Approval Pending'),
        ('APPROVED', 'Approved'),
        ('DISPATCHED', 'Dispatched'),
        ('OTP_PENDING', 'OTP Pending'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
        ('FAILED', 'Failed'),
    ]

    transfer_id = models.CharField(max_length=50, unique=True, db_index=True)
    request = models.ForeignKey(BloodRequest, on_delete=models.CASCADE, related_name='transfers')
    request_allocation = models.ForeignKey(RequestAllocation, on_delete=models.SET_NULL, null=True, blank=True)
    sender_facility = models.ForeignKey(Facility, on_delete=models.CASCADE, related_name='transfers_sent')
    receiver_facility = models.ForeignKey(Facility, on_delete=models.CASCADE, related_name='transfers_received')
    blood_group = models.CharField(max_length=5, choices=BLOOD_GROUPS)
    quantity = models.PositiveIntegerField()
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='CREATED')
    
    otp_code_hash = models.CharField(max_length=128, blank=True, default='')
    otp_created_at = models.DateTimeField(null=True, blank=True)
    otp_attempts = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    dispatched_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.transfer_id} | {self.sender_facility.facility_id} -> {self.receiver_facility.facility_id} ({self.quantity} {self.blood_group}) [{self.status}]"

    class Meta:
        ordering = ['-created_at']
