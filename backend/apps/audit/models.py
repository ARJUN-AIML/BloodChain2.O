from django.db import models
from django.contrib.auth.models import User
from apps.facilities.models import Facility

class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    facility = models.ForeignKey(Facility, on_delete=models.CASCADE, related_name='audit_logs')
    action = models.CharField(max_length=100)
    object_type = models.CharField(max_length=50)
    object_id = models.CharField(max_length=50)
    previous_status = models.CharField(max_length=50, blank=True, default='')
    new_status = models.CharField(max_length=50, blank=True, default='')
    details = models.TextField(blank=True, default='')
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.timestamp}] {self.facility.facility_id} | {self.action} on {self.object_type} {self.object_id}"

    class Meta:
        ordering = ['-timestamp']
