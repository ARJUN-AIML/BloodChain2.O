from django.db import models

class Facility(models.Model):
    FACILITY_TYPES = [
        ('HOSPITAL', 'Hospital'),
        ('BLOOD_BANK', 'Blood Bank'),
    ]

    facility_id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=255)
    facility_type = models.CharField(max_length=20, choices=FACILITY_TYPES)
    district = models.CharField(max_length=100)
    address = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.facility_id})"

    class Meta:
        ordering = ['facility_id']
        verbose_name_plural = 'Facilities'
