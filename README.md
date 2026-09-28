# BloodChain - Decentralized Blood Supply & Verification System

BloodChain is a regional blood supply network connecting hospitals, blood banks, donation camps, and registered donors.

---

## 🩸 QR Verification & Cross-Device Testing Architecture

BloodChain features a cryptographic QR code verification pass system for registered blood donors and emergency donation camps. 

### Why the Firebase "Site Not Found" Error Occurred
Previously, the QR generator was referencing an undeployed Firebase Hosting domain (`https://bloodchain-95960.web.app/verify/<token>`). When scanned by external phones, Firebase naturally returned:
> **Firebase Hosting: Site Not Found**

Additionally, hardcoding `localhost` or `127.0.0.1` inside QR codes fails because mobile phones resolve `localhost` to themselves rather than the developer's laptop.

### Solution Architecture

BloodChain now cleanly decouples development testing from production via configurable environment variables and an HTTPS development tunnel:

```
DEVELOPMENT / CROSS-DEVICE TESTING:
Mobile Phone (iPhone / Android)
       ↓ (Camera scan)
https://<public-tunnel-url>/verify/<secure-token>
       ↓ (Public Internet via Cloudflare HTTPS Tunnel)
Developer Laptop (Vite Dev Server :5173)
       ↓ (Vite /api proxy)
Django Backend (:8000)
       ↓
Verified Donor & Donation Camp Details Displayed

PRODUCTION:
Mobile Phone
       ↓
https://<production-domain>/verify/<secure-token>
       ↓
Production Deployed Application (Firebase Hosting SPA Rewrites)
```

---

## 🚀 Cross-Device QR Testing Workflow (Step-by-Step)

Follow these exact steps to test donor QR codes on an external smartphone before deploying:

### 1. Start the Django Backend Server
In the backend directory:
```bash
cd backend
python manage.py runserver 127.0.0.1:8000
```

### 2. Start the Vite Frontend Development Server
In the frontend directory (running on port `5173`):
```bash
cd frontend
npm run dev
```

### 3. Start the HTTPS Development Tunnel
In a new terminal window from the project root:
```bash
.\cloudflared.exe tunnel --url http://127.0.0.1:5173
```
*(Or in `frontend`: `npm run tunnel` or `npx -y untun tunnel --port 5173`)*

### 4. Copy the Generated Public HTTPS URL
Cloudflare Tunnel will output a public HTTPS link in your terminal, for example:
```text
https://voluntary-premier-celebrate-grill.trycloudflare.com
```

### 5. Set the Public Base URL in `frontend/.env`
Open `frontend/.env` and update `PUBLIC_APP_URL` (or `VITE_PUBLIC_APP_URL`):
```env
PUBLIC_APP_URL=https://voluntary-premier-celebrate-grill.trycloudflare.com
VITE_PUBLIC_APP_URL=https://voluntary-premier-celebrate-grill.trycloudflare.com
```
*Note: Vite dev server automatically reloads when `.env` is modified.*

### 6. Generate/View the Donor QR Code
- Open `http://localhost:5173` on your laptop (or open the public tunnel URL directly).
- Navigate to **Donor Portal** -> **My Registrations** or **Permanent Donor Card**.
- The QR code is automatically generated encoding:
  `${PUBLIC_APP_URL}/verify/<secure-token>`

### 7. Scan the QR Code from Any Phone
- Open the native camera or any QR scanner app on an **iPhone**, **Android**, tablet, or external laptop (connected to any mobile network/Wi-Fi).
- Scan the QR code displayed on the developer's laptop screen.

### 8. Verification Page Loads on Phone
The phone opens the secure HTTPS tunnel:
```text
https://<public-tunnel-url>/verify/<secure-token>
```
There is **NO** Firebase "Site Not Found", **NO** `localhost`, and **NO** network blockage.

### 9. Real Donor + Camp Details Appear
The phone displays the official verified pass:
- **DONOR DETAILS**: Name, Donor ID, Blood Group, Registration Status (`✅ Registered`)
- **CAMP DETAILS**: Camp Name, Organising Hospital/Blood Bank, Camp Venue, Date, Time, Camp Status (`🔴 Emergency`)
- **Verification Seal**: `✓ Information verified by BloodChain`

---

## 🌐 Production Deployment Configuration

When preparing to deploy BloodChain to production:

1. **Set Production Domain in `frontend/.env`**:
   ```env
   PUBLIC_APP_URL=https://your-production-domain.com
   VITE_PUBLIC_APP_URL=https://your-production-domain.com
   ```
2. **Build the Production Bundle**:
   ```bash
   cd frontend
   npm run build
   ```
3. **Firebase Hosting SPA Rewrites**:
   `firebase.json` is configured with wildcard rewrites (`"source": "**", "destination": "/index.html"`). Direct navigation to `/verify/<token>` will route to the SPA smoothly without returning 404 or Site Not Found.
4. **Deploy**:
   ```bash
   firebase deploy --only hosting
   ```

---

## 🔒 Security Best Practices
- **Only Port 5173 is Exposed**: The development tunnel only proxies the frontend development server. Database ports (PostgreSQL, SQLite), Django admin, secrets, and internal services remain private on `localhost`.
- **Cryptographic Tokens**: BloodChain QR codes encode a high-entropy UUIDv4 token (`/verify/<token>`). No personal identifiable information (PII) is exposed in the QR URL.
- **Backend Verification**: All verification queries are validated against the database ledger before returning donor and camp status.
