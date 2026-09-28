from django.db import models
from django.contrib.auth.models import User
from apps.facilities.models import Facility

ROLE_CHOICES = [
    ('HOSPITAL', 'Hospital Admin / Full Workspace'),
    ('HOSPITAL_APPROVAL', 'Hospital Approval Desk'),
    ('HOSPITAL_LOGISTICS', 'Hospital Logistics'),
    ('BLOOD_BANK', 'Blood Bank'),
    ('DONOR', 'Donor'),
]

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    firebase_uid = models.CharField(max_length=128, unique=True, db_index=True)
    name = models.CharField(max_length=150)
    role = models.CharField(max_length=30, choices=ROLE_CHOICES)
    facility = models.ForeignKey(Facility, on_delete=models.CASCADE, related_name='user_profiles', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        facility_str = self.facility.facility_id if self.facility else 'No Facility'
        return f"{self.name} ({self.role} @ {facility_str})"
