import uuid
import random
from django.db import models
from django.contrib.auth.models import User
from apps.inventory.models import BLOOD_GROUPS


def generate_donor_id():
    """Generate a unique BloodChain Donor ID like BC-D-10482"""
    num = random.randint(10000, 99999)
    return f"BC-D-{num}"


class DonorProfile(models.Model):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='donor_profile')
    donor_id = models.CharField(max_length=20, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    blood_group = models.CharField(max_length=5, choices=BLOOD_GROUPS, blank=True, default='')
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True, default='')
    address = models.TextField(blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    state = models.CharField(max_length=100, blank=True, default='Tamil Nadu')
    qr_token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'donor_profiles'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.donor_id})"

    def save(self, *args, **kwargs):
        if not self.donor_id:
            # Generate unique donor ID
            for _ in range(100):
                new_id = generate_donor_id()
                if not DonorProfile.objects.filter(donor_id=new_id).exists():
                    self.donor_id = new_id
                    break
        super().save(*args, **kwargs)

    @property
    def member_since_year(self):
        return self.created_at.year if self.created_at else None

    @property
    def verified_donation_count(self):
        return self.verified_donations.count()

    @property
    def certificates_count(self):
        return self.certificates.count()

    @property
    def achievements(self):
        """Compute achievements dynamically from verified donations."""
        from apps.camps.models import VerifiedDonation
        donations = self.verified_donations.select_related('camp')
        count = donations.count()
        achievements = []

        if count >= 1:
            achievements.append({
                'key': 'first_donation',
                'title': 'First Donation',
                'emoji': '🩸',
                'description': '1 verified donation',
                'unlocked': True
            })
        if count >= 3:
            achievements.append({
                'key': 'regular_donor',
                'title': 'Regular Donor',
                'emoji': '❤️',
                'description': '3 verified donations',
                'unlocked': True
            })
        if count >= 5:
            achievements.append({
                'key': 'bronze_lifesaver',
                'title': 'Bronze Lifesaver',
                'emoji': '🥉',
                'description': '5 verified donations',
                'unlocked': True
            })
        if count >= 10:
            achievements.append({
                'key': 'silver_lifesaver',
                'title': 'Silver Lifesaver',
                'emoji': '🥈',
                'description': '10 verified donations',
                'unlocked': True
            })
        if count >= 20:
            achievements.append({
                'key': 'gold_lifesaver',
                'title': 'Gold Lifesaver',
                'emoji': '🥇',
                'description': '20 verified donations',
                'unlocked': True
            })

        # Emergency Responder
        emergency_count = donations.filter(
            camp__camp_type='EMERGENCY'
        ).count()
        if emergency_count >= 1:
            achievements.append({
                'key': 'emergency_responder',
                'title': 'Emergency Responder',
                'emoji': '🚨',
                'description': 'Donated at an emergency camp',
                'unlocked': True
            })

        # Community Contributor
        facilities_count = donations.values('facility').distinct().count()
        if facilities_count >= 3:
            achievements.append({
                'key': 'community_contributor',
                'title': 'Community Contributor',
                'emoji': '🌍',
                'description': 'Donated at 3+ different facilities',
                'unlocked': True
            })

        return achievements
