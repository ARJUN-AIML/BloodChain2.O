from django.db import models
from apps.facilities.models import Facility

BLOOD_GROUPS = [
    ('A+', 'A+'),
    ('A-', 'A-'),
    ('B+', 'B+'),
    ('B-', 'B-'),
    ('AB+', 'AB+'),
    ('AB-', 'AB-'),
    ('O+', 'O+'),
    ('O-', 'O-'),
]

class BloodInventory(models.Model):
    facility = models.ForeignKey(Facility, on_delete=models.CASCADE, related_name='inventory')
    blood_group = models.CharField(max_length=5, choices=BLOOD_GROUPS)
    available_units = models.IntegerField(default=0)
    reserved_units = models.IntegerField(default=0)
    in_transit_units = models.IntegerField(default=0)
    expired_units = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.facility.facility_id} | {self.blood_group}: {self.available_units} Avail"

    class Meta:
        unique_together = ('facility', 'blood_group')
        ordering = ['facility', 'blood_group']
        verbose_name_plural = 'Blood Inventories'

class BloodBatch(models.Model):
    STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('RESERVED', 'Reserved'),
        ('IN_TRANSIT', 'In Transit'),
        ('RECEIVED', 'Received'),
        ('EXPIRED', 'Expired'),
        ('UNUSABLE', 'Unusable'),
    ]

    batch_id = models.CharField(max_length=50, unique=True)
    facility = models.ForeignKey(Facility, on_delete=models.CASCADE, related_name='batches')
    blood_group = models.CharField(max_length=5, choices=BLOOD_GROUPS)
    quantity = models.IntegerField()
    collection_date = models.DateField()
    expiry_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.batch_id} ({self.blood_group} x{self.quantity}) - {self.status}"

    class Meta:
        ordering = ['expiry_date']
        verbose_name_plural = 'Blood Batches'
