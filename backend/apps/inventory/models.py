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

BLOOD_COMPONENTS = [
    ('RBC', 'Red Blood Cells (PRBC)'),
    ('WBC', 'White Blood Cells (Granulocytes)'),
    ('Plasma', 'Fresh Frozen Plasma (FFP)'),
    ('Platelets', 'Platelets (Platelet Concentrate)'),
    ('Cryoprecipitate', 'Cryoprecipitate'),
    ('Whole Blood', 'Whole Blood'),
]

class BloodInventory(models.Model):
    facility = models.ForeignKey(Facility, on_delete=models.CASCADE, related_name='inventory')
    blood_group = models.CharField(max_length=5, choices=BLOOD_GROUPS)
    blood_component = models.CharField(max_length=30, choices=BLOOD_COMPONENTS, default='RBC')
    available_units = models.IntegerField(default=0)
    reserved_units = models.IntegerField(default=0)
    in_transit_units = models.IntegerField(default=0)
    expired_units = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.facility.facility_id} | {self.blood_group} ({self.blood_component}): {self.available_units} Avail"

    class Meta:
        unique_together = ('facility', 'blood_group', 'blood_component')
        ordering = ['facility', 'blood_group', 'blood_component']
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
    blood_component = models.CharField(max_length=30, choices=BLOOD_COMPONENTS, default='RBC')
    quantity = models.IntegerField()
    collection_date = models.DateField()
    expiry_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.batch_id} ({self.blood_group} {self.blood_component} x{self.quantity}) - {self.status}"

    class Meta:
        ordering = ['expiry_date']
        verbose_name_plural = 'Blood Batches'

class FacilityDailyRecord(models.Model):
    """
    Stores historical daily facility records from bloodchain_all_facilities_area_based_ids.csv in Neon PostgreSQL.
    """
    facility_id = models.CharField(max_length=20, db_index=True)
    facility_name = models.CharField(max_length=255)
    facility_type = models.CharField(max_length=50)
    district = models.CharField(max_length=100, db_index=True)
    date = models.DateField(db_index=True)
    blood_group = models.CharField(max_length=10, db_index=True)
    blood_component = models.CharField(max_length=50, db_index=True)
    units_requested = models.IntegerField(default=0)
    units_issued = models.IntegerField(default=0)
    units_received = models.IntegerField(default=0)
    units_transferred_out = models.IntegerField(default=0)
    units_expired = models.IntegerField(default=0)
    available_stock = models.IntegerField(default=0)

    class Meta:
        db_table = 'facility_daily_records'
        indexes = [
            models.Index(fields=['facility_id', 'date']),
            models.Index(fields=['district', 'date']),
            models.Index(fields=['blood_group', 'blood_component']),
        ]
        verbose_name = 'Facility Daily Record'
        verbose_name_plural = 'Facility Daily Records'

    def __str__(self):
        return f"{self.facility_id} | {self.date} | {self.blood_group} ({self.blood_component}) - Avail: {self.available_stock}"
