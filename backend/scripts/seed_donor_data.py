import os
import sys
from datetime import timedelta
from datetime import date

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from django.contrib.auth.models import User
from apps.accounts.models import UserProfile
from apps.facilities.models import Facility
from apps.donors.models import DonorProfile
from apps.camps.models import (
    DonationCamp, CampRegistration, VerifiedDonation, 
    DonationCertificate, DonorNotification
)

def seed_donors_and_camps():
    print("--- Starting Donor & Camps Seeding ---")
    now = timezone.now()

    # 1. Fetch available facilities
    facilities = list(Facility.objects.filter(is_active=True))
    if not facilities:
        print("Creating fallback facilities...")
        f1, _ = Facility.objects.get_or_create(
            facility_id="FAC_HOSP_001",
            defaults={
                "name": "Apollo Speciality Hospital",
                "facility_type": "HOSPITAL",
                "district": "Chennai",
                "address": "21 Greams Lane, Thousand Lights, Chennai",
                "is_active": True
            }
        )
        f2, _ = Facility.objects.get_or_create(
            facility_id="FAC_BB_001",
            defaults={
                "name": "Rotary Central Blood Bank",
                "facility_type": "BLOOD_BANK",
                "district": "Chennai",
                "address": "56 Marshalls Road, Egmore, Chennai",
                "is_active": True
            }
        )
        facilities = [f1, f2]

    hospitals = [f for f in facilities if f.facility_type == 'HOSPITAL'] or facilities
    blood_banks = [f for f in facilities if f.facility_type == 'BLOOD_BANK'] or facilities

    print(f"Found {len(facilities)} facilities ({len(hospitals)} hospitals, {len(blood_banks)} blood banks).")

    # Staff user for verification
    staff_user = User.objects.filter(is_superuser=True).first()
    if not staff_user:
        staff_user = User.objects.filter(username='admin').first()
    if not staff_user:
        staff_user, _ = User.objects.get_or_create(
            username='facility_staff',
            defaults={'email': 'staff@bloodchain.org', 'first_name': 'Staff', 'last_name': 'Verifier'}
        )

    # 2. Create Donors
    donors_data = [
        {
            "username": "donor_001",
            "firebase_uid": "dev-token-donor-001",
            "email": "arun.kumar@example.com",
            "first_name": "Arun",
            "last_name": "Kumar",
            "blood_group": "O+",
            "gender": "M",
            "phone": "+91 98765 43210",
            "city": "Chennai",
            "address": "45/2 Anna Nagar West, Chennai",
        },
        {
            "username": "donor_priya",
            "email": "priya.patel@example.com",
            "first_name": "Priya",
            "last_name": "Patel",
            "blood_group": "A+",
            "gender": "F",
            "phone": "+91 98765 43211",
            "city": "Coimbatore",
            "address": "12 RS Puram, Coimbatore",
        },
        {
            "username": "donor_anand",
            "email": "anand.kumar@example.com",
            "first_name": "Anand",
            "last_name": "Kumar",
            "blood_group": "AB-",
            "gender": "M",
            "phone": "+91 98765 43212",
            "city": "Chennai",
            "address": "88 Besant Nagar, Chennai",
        }
    ]

    created_donors = []
    for d in donors_data:
        user, u_created = User.objects.get_or_create(
            username=d["username"],
            defaults={
                "email": d["email"],
                "first_name": d["first_name"],
                "last_name": d["last_name"],
            }
        )
        if u_created:
            user.set_password("donor123456")
            user.save()

        # UserProfile
        fb_uid = d.get("firebase_uid", f"donor_uid_{user.username}")
        uprof, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                "name": f"{d['first_name']} {d['last_name']}",
                "role": "DONOR",
                "facility": None,
                "is_active": True,
                "firebase_uid": fb_uid
            }
        )
        uprof.role = "DONOR"
        uprof.facility = None
        uprof.firebase_uid = fb_uid
        uprof.save()

        # DonorProfile
        donor_profile, dp_created = DonorProfile.objects.get_or_create(
            user=user,
            defaults={
                "name": f"{d['first_name']} {d['last_name']}",
                "phone": d["phone"],
                "email": d["email"],
                "blood_group": d["blood_group"],
                "gender": d["gender"],
                "city": d["city"],
                "state": "Tamil Nadu",
                "address": d["address"],
                "date_of_birth": date(1996, 5, 14),
                "is_active": True,
            }
        )
        print(f"Donor ready: {donor_profile.name} ({donor_profile.donor_id}) - Blood: {donor_profile.blood_group} - Token: {donor_profile.qr_token}")
        created_donors.append((user, donor_profile, d))

    primary_donor_user, primary_donor_profile, _ = created_donors[0]
    secondary_donor_user, secondary_donor_profile, _ = created_donors[1]

    # 3. Create realistic Camps across Tamil Nadu
    camps_data = [
        {
            "camp_name": "Red Cross Mega Blood Donation Drive",
            "organizer": blood_banks[0],
            "camp_type": "SPECIAL",
            "urgency": "NORMAL",
            "status": "UPCOMING",
            "venue_name": "Valluvar Kottam Exhibition Hall",
            "venue_address": "Valluvar Kottam High Rd, Ponnangipuram, Nungambakkam, Chennai",
            "latitude": 13.0558,
            "longitude": 80.2425,
            "start_offset_days": 2,
            "duration_hours": 8,
            "required_blood_groups": ["O-", "B-", "AB-", "O+"],
            "max_donors": 150,
            "description": "Annual city-wide blood donation drive organized in collaboration with prominent medical colleges. Refreshments, free health check-up, and digital certification provided.",
            "contact_phone": "+91 94440 12345",
            "contact_email": "camps@redcross-chennai.org"
        },
        {
            "camp_name": "Apollo Emergency Response Camp",
            "organizer": hospitals[0],
            "camp_type": "EMERGENCY",
            "urgency": "CRITICAL",
            "status": "ACTIVE",
            "venue_name": "Apollo Greams Road Community Center",
            "venue_address": "21 Greams Lane, Off Greams Road, Thousand Lights, Chennai",
            "latitude": 13.0604,
            "longitude": 80.2496,
            "start_offset_days": 0, # ACTIVE TODAY!
            "duration_hours": 10,
            "required_blood_groups": ["A+", "O+", "B+", "O-"],
            "max_donors": 80,
            "description": "Critical response drive for emergency trauma cases and upcoming scheduled major surgeries. Walk-ins welcome!",
            "contact_phone": "+91 98401 54321",
            "contact_email": "bloodbank@apollohospitals.com"
        },
        {
            "camp_name": "Coimbatore Tech Park Corporate Blood Drive",
            "organizer": blood_banks[min(1, len(blood_banks)-1)],
            "camp_type": "ROUTINE",
            "urgency": "NORMAL",
            "status": "UPCOMING",
            "venue_name": "Tidel Park Campus Ground Floor Atrium",
            "venue_address": "Civil Aerodrome Post, Peelamedu, Coimbatore",
            "latitude": 11.0284,
            "longitude": 77.0279,
            "start_offset_days": 5,
            "duration_hours": 7,
            "required_blood_groups": ["O+", "A-", "B+"],
            "max_donors": 120,
            "description": "Corporate donor drive inviting tech professionals to donate and save lives. Pre-registration recommended for time slots.",
            "contact_phone": "+91 97890 87654",
            "contact_email": "camps@coimbatorebloodbank.org"
        },
        {
            "camp_name": "Madurai Medical College Youth Life Saver Drive",
            "organizer": hospitals[min(1, len(hospitals)-1)],
            "camp_type": "SPECIAL",
            "urgency": "NORMAL",
            "status": "UPCOMING",
            "venue_name": "Madurai Medical College Auditorium",
            "venue_address": "Alagar Kovil Road, K.Pudur, Madurai",
            "latitude": 9.9252,
            "longitude": 78.1198,
            "start_offset_days": 9,
            "duration_hours": 8,
            "required_blood_groups": ["B+", "AB+", "O-"],
            "max_donors": 200,
            "description": "Student and youth initiative for blood donation awareness. Verified certificates instantly synced with BloodChain.",
            "contact_phone": "+91 94432 99881",
            "contact_email": "mmc.bloodbank@tn.gov.in"
        },
        {
            "camp_name": "Salem Rotary Life Line Camp",
            "organizer": blood_banks[0],
            "camp_type": "ROUTINE",
            "urgency": "NORMAL",
            "status": "COMPLETED",
            "venue_name": "Rotary Hall, Meyyanur",
            "venue_address": "Junction Main Road, Meyyanur, Salem",
            "latitude": 11.6643,
            "longitude": 78.1460,
            "start_offset_days": -0.5, # COMPLETED 12 hours ago (within 24 hours, so still visible on map!)
            "duration_hours": 8,
            "required_blood_groups": ["O+", "A+"],
            "max_donors": 90,
            "description": "Successfully completed community blood drive. All units screened and dispatched to regional trauma centers.",
            "contact_phone": "+91 93450 11223",
            "contact_email": "rotarysalem@bloodchain.org"
        },
        {
            "camp_name": "Tambaram Railway Community Drive",
            "organizer": hospitals[0],
            "camp_type": "ROUTINE",
            "urgency": "NORMAL",
            "status": "COMPLETED",
            "venue_name": "Tambaram Community Hall",
            "venue_address": "GST Road, Tambaram Sanatorium, Chennai",
            "latitude": 12.9249,
            "longitude": 80.1274,
            "start_offset_days": -4, # COMPLETED 4 days ago (>24h ago, DB only, NOT on active map)
            "duration_hours": 6,
            "required_blood_groups": ["O+"],
            "max_donors": 70,
            "description": "Past drive for railway employees and residents of Tambaram.",
            "contact_phone": "+91 98410 33445",
            "contact_email": "tambaram.drive@bloodchain.org"
        }
    ]

    created_camps = []
    for c in camps_data:
        start_time = now + timedelta(days=c["start_offset_days"])
        if c["status"] == "ACTIVE":
            start_time = now.replace(hour=8, minute=0, second=0)
        end_time = start_time + timedelta(hours=c["duration_hours"])
        completed_at = end_time if c["status"] == "COMPLETED" else None

        camp, _ = DonationCamp.objects.get_or_create(
            camp_name=c["camp_name"],
            organizer=c["organizer"],
            defaults={
                "camp_type": c["camp_type"],
                "urgency": c["urgency"],
                "status": c["status"],
                "venue_name": c["venue_name"],
                "venue_address": c["venue_address"],
                "latitude": c["latitude"],
                "longitude": c["longitude"],
                "start_datetime": start_time,
                "end_datetime": end_time,
                "required_blood_groups": c["required_blood_groups"],
                "max_donors": c["max_donors"],
                "description": c["description"],
                "contact_phone": c["contact_phone"],
                "contact_email": c["contact_email"],
                "completed_at": completed_at,
            }
        )
        print(f"Camp: {camp.camp_name} ({camp.camp_id}) - Status: {camp.status}")
        created_camps.append(camp)

    upcoming_camp = created_camps[0]
    active_camp = created_camps[1]
    completed_camp_recent = created_camps[4]
    completed_camp_old = created_camps[5]

    # 4. Registrations
    r1, _ = CampRegistration.objects.get_or_create(
        camp=upcoming_camp,
        donor=primary_donor_profile,
        defaults={"status": "REGISTERED"}
    )

    r2, _ = CampRegistration.objects.get_or_create(
        camp=active_camp,
        donor=secondary_donor_profile,
        defaults={
            "status": "CHECKED_IN",
            "checked_in_at": now - timedelta(minutes=45),
            "checked_in_by": staff_user
        }
    )

    r3, _ = CampRegistration.objects.get_or_create(
        camp=completed_camp_old,
        donor=primary_donor_profile,
        defaults={
            "status": "COMPLETED",
            "checked_in_at": completed_camp_old.start_datetime + timedelta(minutes=30),
            "checked_in_by": staff_user
        }
    )
    print("Registrations created.")

    # 5. Verified Donations & Certificates for Rahul (primary donor)
    donations_history = [
        {
            "camp": completed_camp_old,
            "facility": hospitals[0],
            "days_ago": 110,
            "units": 1.0,
            "notes": "Verified whole blood donation. Excellent vitals."
        },
        {
            "camp": completed_camp_recent,
            "facility": blood_banks[0],
            "days_ago": 230,
            "units": 1.0,
            "notes": "Community camp donation. Screened and approved."
        },
        {
            "camp": completed_camp_old,
            "facility": hospitals[0],
            "days_ago": 360,
            "units": 1.0,
            "notes": "Emergency replacement donation. Verified on-site."
        },
        {
            "camp": completed_camp_recent,
            "facility": blood_banks[min(1, len(blood_banks)-1)],
            "days_ago": 480,
            "units": 1.0,
            "notes": "Annual corporate camp donation."
        }
    ]

    for item in donations_history:
        d_datetime = now - timedelta(days=item["days_ago"])
        vd, v_created = VerifiedDonation.objects.get_or_create(
            donor=primary_donor_profile,
            donation_datetime=d_datetime,
            defaults={
                "camp": item["camp"],
                "facility": item["facility"],
                "blood_group": primary_donor_profile.blood_group,
                "units_donated": item["units"],
                "verified_by": staff_user,
                "notes": item["notes"]
            }
        )

        cert, _ = DonationCertificate.objects.get_or_create(
            donation=vd,
            defaults={
                "donor": primary_donor_profile,
                "facility_name": vd.facility.name if vd.facility else "BloodChain Center",
                "camp_name": vd.camp.camp_name if vd.camp else "Hospital Walk-in Center",
                "donation_date": vd.donation_datetime.date(),
            }
        )
        print(f"Verified Donation {vd.donation_id} -> Certificate {cert.certificate_id}")

    # 6. Notifications
    notifications_data = [
        {
            "type": "CAMP_REMINDER",
            "title": "Upcoming Camp: Red Cross Mega Blood Donation Drive",
            "message": "Your registered donation slot is in 2 days at Valluvar Kottam Exhibition Hall. Please remember to stay hydrated!",
            "camp": upcoming_camp,
            "is_read": False,
        },
        {
            "type": "EMERGENCY_CAMP",
            "title": "CRITICAL Blood Need: Apollo Emergency Response Camp",
            "message": "Apollo Emergency Response Camp has a critical shortage of O+ / O- blood for trauma units today. Your contribution can save lives immediately.",
            "camp": active_camp,
            "is_read": False,
        },
        {
            "type": "CERTIFICATE_READY",
            "title": "Donation Certificate Available",
            "message": "Your official BloodChain Verified Donation Certificate for your previous contribution is ready for download and verification.",
            "camp": None,
            "is_read": True,
        }
    ]

    for n in notifications_data:
        DonorNotification.objects.get_or_create(
            donor=primary_donor_profile,
            title=n["title"],
            defaults={
                "notification_type": n["type"],
                "message": n["message"],
                "related_camp": n["camp"],
                "is_read": n["is_read"]
            }
        )

    print("--- Seeding Completed Successfully! ---")

if __name__ == '__main__':
    seed_donors_and_camps()
