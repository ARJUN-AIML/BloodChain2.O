import uuid
from django.db import models
from django.contrib.auth.models import User
from apps.facilities.models import Facility
from apps.donors.models import DonorProfile
from apps.inventory.models import BLOOD_GROUPS


class DonationCamp(models.Model):
    CAMP_TYPE_CHOICES = [
        ('EMERGENCY', 'Emergency'),
        ('ROUTINE', 'Routine'),
        ('SPECIAL', 'Special Drive'),
    ]
    URGENCY_CHOICES = [
        ('CRITICAL', 'Critical'),
        ('NORMAL', 'Normal'),
        ('LOW', 'Low'),
    ]
    STATUS_CHOICES = [
        ('UPCOMING', 'Upcoming'),
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    camp_id = models.CharField(max_length=30, unique=True, db_index=True)
    camp_name = models.CharField(max_length=300)
    organizer = models.ForeignKey(Facility, on_delete=models.CASCADE, related_name='organized_camps')
    camp_type = models.CharField(max_length=20, choices=CAMP_TYPE_CHOICES, default='ROUTINE')
    urgency = models.CharField(max_length=20, choices=URGENCY_CHOICES, default='NORMAL')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='UPCOMING')
    venue_name = models.CharField(max_length=300)
    venue_address = models.TextField()
    latitude = models.FloatField()
    longitude = models.FloatField()
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    required_blood_groups = models.JSONField(default=list, blank=True)
    description = models.TextField(blank=True, default='')
    contact_phone = models.CharField(max_length=20, blank=True, default='')
    contact_email = models.EmailField(blank=True, default='')
    max_donors = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'donation_camps'
        ordering = ['-start_datetime']
        indexes = [
            models.Index(fields=['status', 'start_datetime']),
            models.Index(fields=['organizer', 'status']),
        ]

    def __str__(self):
        return f"{self.camp_name} ({self.camp_id}) - {self.status}"

    def save(self, *args, **kwargs):
        if not self.camp_id:
            from datetime import datetime
            import random
            date_str = datetime.now().strftime('%Y%m%d')
            num = random.randint(100, 999)
            self.camp_id = f"CAMP-{date_str}-{num}"
            while DonationCamp.objects.filter(camp_id=self.camp_id).exists():
                num = random.randint(100, 999)
                self.camp_id = f"CAMP-{date_str}-{num}"
        super().save(*args, **kwargs)

    @property
    def registered_count(self):
        return self.registrations.exclude(status='CANCELLED').count()

    @property
    def checked_in_count(self):
        return self.registrations.filter(status__in=['CHECKED_IN', 'COMPLETED']).count()

    @property
    def organizer_type(self):
        return self.organizer.facility_type if self.organizer else 'HOSPITAL'


class CampRegistration(models.Model):
    STATUS_CHOICES = [
        ('REGISTERED', 'Registered'),
        ('CHECKED_IN', 'Checked In'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
        ('NO_SHOW', 'No Show'),
    ]

    camp = models.ForeignKey(DonationCamp, on_delete=models.CASCADE, related_name='registrations')
    donor = models.ForeignKey(DonorProfile, on_delete=models.CASCADE, related_name='camp_registrations')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='REGISTERED')
    preferred_timeslot = models.CharField(max_length=100, blank=True, default='09:00 AM - 10:00 AM')
    notes = models.TextField(blank=True, default='')
    registered_at = models.DateTimeField(auto_now_add=True)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    checked_in_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='checkins_performed')

    class Meta:
        db_table = 'camp_registrations'
        unique_together = ('camp', 'donor')
        ordering = ['-registered_at']

    def __str__(self):
        return f"{self.donor.donor_id} @ {self.camp.camp_id} - {self.status}"


class VerifiedDonation(models.Model):
    donation_id = models.CharField(max_length=30, unique=True, db_index=True)
    donor = models.ForeignKey(DonorProfile, on_delete=models.CASCADE, related_name='verified_donations')
    camp = models.ForeignKey(DonationCamp, on_delete=models.CASCADE, related_name='donations')
    facility = models.ForeignKey(Facility, on_delete=models.CASCADE, related_name='verified_donations')
    camp_registration = models.ForeignKey(CampRegistration, on_delete=models.SET_NULL, null=True, blank=True)
    blood_group = models.CharField(max_length=5, choices=BLOOD_GROUPS)
    units_donated = models.FloatField(default=1.0)
    donation_datetime = models.DateTimeField()
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='donations_verified')
    verified_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'verified_donations'
        ordering = ['-donation_datetime']

    def __str__(self):
        return f"{self.donation_id} - {self.donor.donor_id} @ {self.camp.camp_id}"

    def save(self, *args, **kwargs):
        if not self.donation_id:
            from datetime import datetime
            import random
            date_str = datetime.now().strftime('%Y%m%d')
            num = random.randint(100, 999)
            self.donation_id = f"DON-{date_str}-{num}"
            while VerifiedDonation.objects.filter(donation_id=self.donation_id).exists():
                num = random.randint(100, 999)
                self.donation_id = f"DON-{date_str}-{num}"
        super().save(*args, **kwargs)


class DonationCertificate(models.Model):
    certificate_id = models.CharField(max_length=30, unique=True, db_index=True)
    donation = models.OneToOneField(VerifiedDonation, on_delete=models.CASCADE, related_name='certificate')
    donor = models.ForeignKey(DonorProfile, on_delete=models.CASCADE, related_name='certificates')
    facility_name = models.CharField(max_length=300)
    camp_name = models.CharField(max_length=300)
    donation_date = models.DateField()
    qr_token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'donation_certificates'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.certificate_id} - {self.donor.donor_id}"

    def save(self, *args, **kwargs):
        if not self.certificate_id:
            from datetime import datetime
            import random
            year = datetime.now().year
            num = random.randint(10000, 99999)
            self.certificate_id = f"BC-CERT-{year}-{num:05d}"
            while DonationCertificate.objects.filter(certificate_id=self.certificate_id).exists():
                num = random.randint(10000, 99999)
                self.certificate_id = f"BC-CERT-{year}-{num:05d}"
        super().save(*args, **kwargs)


class DonorNotification(models.Model):
    TYPE_CHOICES = [
        ('CAMP_REGISTERED', 'Camp Registration'),
        ('CAMP_REMINDER', 'Camp Reminder'),
        ('CAMP_CANCELLED', 'Camp Cancelled'),
        ('CAMP_UPDATED', 'Camp Updated'),
        ('DONATION_VERIFIED', 'Donation Verified'),
        ('CERTIFICATE_READY', 'Certificate Ready'),
        ('ACHIEVEMENT_UNLOCKED', 'Achievement Unlocked'),
        ('EMERGENCY_CAMP', 'Emergency Camp'),
        ('GENERAL', 'General'),
    ]

    donor = models.ForeignKey(DonorProfile, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=300)
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='GENERAL')
    related_camp = models.ForeignKey(DonationCamp, on_delete=models.SET_NULL, null=True, blank=True)
    related_donation = models.ForeignKey(VerifiedDonation, on_delete=models.SET_NULL, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'donor_notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.donor.donor_id}: {self.title}"
