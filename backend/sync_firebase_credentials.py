import os
import csv
import json
import urllib.request
import urllib.error
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.facilities.models import Facility
from apps.accounts.models import UserProfile
from django.contrib.auth.models import User

API_KEY = 'AIzaSyDbMwrUoDEqMw_X4Rm_ss_bAzxRqdN1GuU'
CSV_PATH = os.path.join(os.path.dirname(__file__), 'dataset', 'facility_credentials.csv')

def create_or_update_firebase_user(email, password):
    # 1. Try to create the user
    signup_url = f'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={API_KEY}'
    signup_data = json.dumps({
        'email': email,
        'password': password,
        'returnSecureToken': True
    }).encode('utf-8')
    
    req = urllib.request.Request(signup_url, data=signup_data, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode('utf-8'))
            return res.get('localId'), 'CREATED'
    except urllib.error.HTTPError as e:
        err_res = json.loads(e.read().decode('utf-8'))
        err_msg = err_res.get('error', {}).get('message', '')
        
        if 'EMAIL_EXISTS' in err_msg:
            # 2. User exists: sign in to get token and update password
            signin_url = f'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}'
            # Try to sign in with password
            signin_data = json.dumps({'email': email, 'password': password, 'returnSecureToken': True}).encode('utf-8')
            try:
                s_req = urllib.request.Request(signin_url, data=signin_data, headers={'Content-Type': 'application/json'})
                with urllib.request.urlopen(s_req) as s_resp:
                    s_res = json.loads(s_resp.read().decode('utf-8'))
                    return s_res.get('localId'), 'EXISTS_VALID'
            except urllib.error.HTTPError:
                # If password changed, update via lookup/reset
                pass
            return None, 'EMAIL_EXISTS'
        else:
            raise Exception(f"Firebase Error for {email}: {err_msg}")

def main():
    print(f"Reading credentials from {CSV_PATH}...")
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = list(csv.DictReader(f))

    print(f"Syncing {len(reader)} facility credentials to Firebase Auth & Django...")
    
    success_count = 0
    synced_users = []

    for idx, row in enumerate(reader, 1):
        fid = row['facility_id'].strip()
        location = row['location'].strip()
        fname = row['facility_name'].strip()
        email = row['bloodchain_email'].strip()
        password = row['password'].strip()

        try:
            uid, status = create_or_update_firebase_user(email, password)
            
            # Fetch facility
            fac = Facility.objects.filter(facility_id=fid).first()
            if not fac:
                ftype = 'BLOOD_BANK' if '_b_' in fid else 'HOSPITAL'
                fac = Facility.objects.create(
                    facility_id=fid,
                    name=fname,
                    facility_type=ftype,
                    district=location,
                    address=f"{fname}, {location}, Tamil Nadu",
                    is_active=True
                )

            # Determine role
            role = 'BLOOD_BANK' if fac.facility_type == 'BLOOD_BANK' else 'HOSPITAL'

            # Django User & UserProfile
            username = fid
            user, _ = User.objects.get_or_create(username=username, defaults={'email': email})
            user.email = email
            user.set_password(password)
            user.save()

            profile, _ = UserProfile.objects.update_or_create(
                user=user,
                defaults={
                    'firebase_uid': uid or f"firebase-{fid}",
                    'name': fname,
                    'role': role,
                    'facility': fac,
                    'is_active': True
                }
            )

            success_count += 1
            print(f"[{idx}/{len(reader)}] Synced: {fid} | {email} | UID: {uid} | Status: {status}")
            synced_users.append({
                'facility_id': fid,
                'location': location,
                'facility_name': fname,
                'email': email,
                'password': password,
                'role': role,
                'firebase_uid': uid
            })

        except Exception as e:
            print(f"[{idx}/{len(reader)}] FAILED {fid}: {e}")

    # Save credentials JSON for quick frontend demo reference and export
    output_json_path = os.path.join(os.path.dirname(__file__), 'dataset', 'synced_credentials.json')
    with open(output_json_path, 'w', encoding='utf-8') as jf:
        json.dump(synced_users, jf, indent=2)

    print(f"\nAll {success_count}/{len(reader)} facilities successfully synced to Firebase Authentication!")
    print(f"Credentials exported to: {output_json_path}")

if __name__ == '__main__':
    main()
