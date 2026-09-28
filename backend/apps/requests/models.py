from django.db import models
from django.contrib.auth.models import User
from apps.facilities.models import Facility
from apps.inventory.models import BLOOD_GROUPS

class BloodRequest(models.Model):
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('EMERGENCY', 'Emergency'),
    ]

    STATUS_CHOICES = [
        ('PENDING_APPROVAL', 'Pending Approval'),
        ('ACCEPTED', 'Accepted'),
        ('PARTIALLY_FULFILLED', 'Partially Fulfilled'),
        ('FULFILLED', 'Fulfilled'),
        ('REJECTED', 'Rejected'),
        ('CANCELLED', 'Cancelled'),
    ]

    request_id = models.CharField(max_length=50, unique=True, db_index=True)
    requesting_facility = models.ForeignKey(Facility, on_delete=models.CASCADE, related_name='requests_created')
    blood_group = models.CharField(max_length=5, choices=BLOOD_GROUPS)
    requested_quantity = models.PositiveIntegerField()
    fulfilled_quantity = models.PositiveIntegerField(default=0)
    required_date = models.DateField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='MEDIUM')
    reason = models.TextField(blank=True, default='')
    notes = models.TextField(blank=True, default='')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='PENDING_APPROVAL')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def remaining_quantity(self):
        return max(0, self.requested_quantity - self.fulfilled_quantity)

    def __str__(self):
        return f"{self.request_id} | {self.requesting_facility.facility_id} needs {self.requested_quantity} {self.blood_group}"

    class Meta:
        ordering = ['-created_at']

class RequestAllocation(models.Model):
    STATUS_CHOICES = [
        ('OFFERED', 'Offered'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
        ('CANCELLED', 'Cancelled'),
    ]

    allocation_id = models.CharField(max_length=50, unique=True, db_index=True)
    request = models.ForeignKey(BloodRequest, on_delete=models.CASCADE, related_name='allocations')
    responding_facility = models.ForeignKey(Facility, on_delete=models.CASCADE, related_name='request_responses')
    offered_quantity = models.PositiveIntegerField()
    accepted_quantity = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACCEPTED')
    responded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.allocation_id} | {self.responding_facility.facility_id} allocated {self.accepted_quantity} for {self.request.request_id}"

    class Meta:
        ordering = ['-created_at']
