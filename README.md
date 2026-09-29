# BloodChain - Decentralized Blood Supply & Verification System

BloodChain is a regional blood supply network connecting hospitals, blood banks, donation camps, and registered donors with AI-driven XGBoost demand forecasting and cryptographic QR pass verification.

---

## 🐳 Running BloodChain with Docker (Zero Host Dependencies)

BloodChain is fully containerized. A developer or operator on a clean machine only needs **Docker Desktop / Docker Engine** and **Git** installed. You do **not** need Node.js, Python, npm, pip, PostgreSQL, ML packages, or any other runtime on your host machine.

### Quick Start (1-Command Launch)

```bash
# 1. Clone the repository
git clone https://github.com/Arjunkrishnan-17/Bloodchain_with_UI.git
cd BloodChain2.O

# 2. Configure environment variables (defaults work out of the box)
cp .env.example .env

# 3. Build and launch all services
docker compose up --build
```

Once started, BloodChain services are accessible at:

| Service | Access URL | Description |
|---|---|---|
| **Frontend Web App** | `http://localhost:3000` | Complete React 18 UI with maps, portals, QR passes |
| **Backend REST API** | `http://localhost:8000/api/` | Django REST Framework API |
| **Backend Health Check** | `http://localhost:8000/api/health/` | Container readiness & database connection status |
| **Django Admin Panel** | `http://localhost:8000/admin/` | Administrative dashboard |
| **PostgreSQL Database** | Internal (`db:5432`) | Isolated database container with persistent volume |

---

### Container Architecture

```
                       [ Host / Browser ]
                                |
             +------------------+------------------+
             |                                     |
       Port 3000 (HTTP)                       Port 8000 (HTTP)
             |                                     |
             v                                     v
+-------------------------+             +-------------------------+
|    frontend container   |             |    backend container    |
|   (Nginx 1.27 Alpine)   |             |   (Python 3.12 Slim)    |
|                         |             |                         |
|  * React 18 Production  |             |  * Django 5 + DRF       |
|  * Client-side Routing  |             |  * Gunicorn WSGI        |
|  * Reverse Proxy /api/  | ----------> |  * XGBoost ML Engine    |
|  * OpenStreetMap Tiles  |             |  * Scikit-Learn/Pandas  |
+-------------------------+             +-------------------------+
                                                     |
                                            Port 5432 (Internal)
                                                     |
                                                     v
                                        +-------------------------+
                                        |      db container       |
                                        |  (PostgreSQL 16 Alpine) |
                                        |                         |
                                        |  * Automated Migration  |
                                        |  * Idempotent Seeding   |
                                        |  * Persistent Volume    |
                                        +-------------------------+
```

---

### Key Operational Commands

#### View Real-Time Service Logs
```bash
# View combined live logs for all services
docker compose logs -f

# View logs for a specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

#### Check Service Status & Health
```bash
docker compose ps
```

#### Stop the System
```bash
# Stop containers gracefully (preserves database data)
docker compose stop

# Stop and remove containers and networks
docker compose down
```

#### Restart Services
```bash
docker compose restart
```

#### Rebuild Containers from Scratch (No Cache)
```bash
docker compose build --no-cache
docker compose up -d
```

#### Reset / Wipe Persistent Database Data
```bash
# WARNING: Removes all saved database records and restarts fresh
docker compose down -v
docker compose up --build
```

---

### Database Persistence & Automated Initialization

1. **Persistent Volume**: Database records are stored in a dedicated Docker named volume (`bloodchain_db_data`). Restarting or stopping containers will **not** lose your hospitals, blood inventory, donor registrations, or transfer logs.
2. **Automatic Migration**: On startup, the backend container automatically waits for PostgreSQL to become healthy and runs `python manage.py migrate --noinput`.
3. **Idempotent Data Seeding**: If the database is brand new (0 facilities detected), the container automatically initializes:
   - 50 accredited Tamil Nadu hospitals and blood banks with area-based facility credentials
   - Initial blood inventory balances across 8 blood groups and 4 components
   - Donation camps, verified donors, and registration passes
   
   If data already exists, the seeding step safely skips to prevent duplication.

---

### Machine Learning (XGBoost) Containerization

- Pre-trained XGBoost model artifacts (`.joblib` and `.json`) located in `backend/ml_models/` are baked into the container image and mounted to the `bloodchain_ml_models` volume.
- The Python 3.12 environment inside the container includes pinned versions of `xgboost`, `scikit-learn`, `joblib`, `pandas`, `numpy`, and `scipy`.
- Facility-isolated 7-day demand forecasts for Hospitals (`units_requested`) and Blood Banks (`units_transferred_out`) execute reliably inside the container using container-relative paths.

---

### Environment Variables Reference

Copy `.env.example` to `.env` to customize settings:

```env
# --- Django Core ---
DJANGO_SECRET_KEY=django-insecure-bloodchain-master-key-2026
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,backend,frontend,*
BACKEND_PORT=8000

# --- Database ---
POSTGRES_DB=bloodchain
POSTGRES_USER=bloodchain
POSTGRES_PASSWORD=bloodchain_secret_2026
DATABASE_URL=postgresql://bloodchain:bloodchain_secret_2026@db:5432/bloodchain

# --- Frontend ---
FRONTEND_PORT=3000
VITE_API_BASE_URL=/api
PUBLIC_APP_URL=http://localhost:3000

# --- Firebase Web App Credentials ---
FIREBASE_PROJECT_ID=bloodchain-95960
FIREBASE_API_KEY=AIzaSyDbMwrUoDEqMw_X4Rm_ss_bAzxRqdN1GuU
FIREBASE_AUTH_DOMAIN=bloodchain-95960.firebaseapp.com
FIREBASE_DATABASE_URL=https://bloodchain-95960-default-rtdb.asia-southeast1.firebasedatabase.app
```

---

### Troubleshooting Common Issues

| Issue | Cause | Solution |
|---|---|---|
| **Port 3000 or 8000 already in use** | Another service is using the port on the host | Set `FRONTEND_PORT=3001` or `BACKEND_PORT=8001` in `.env` and run `docker compose up -d` |
| **Backend waiting for database** | Database container is still initializing | The backend automatically waits up to 60s for PostgreSQL. Check `docker compose logs db` |
| **Database data needs complete reset** | Corrupted or unwanted test records | Run `docker compose down -v` and `docker compose up --build` |
| **Frontend unable to reach API** | Nginx proxy configuration or backend down | Check backend health at `http://localhost:8000/api/health/` and `docker compose ps` |

---

## 🩸 QR Verification & Cross-Device Testing Architecture

BloodChain features a cryptographic QR code verification pass system for registered blood donors and emergency donation camps. 

### Why the Firebase "Site Not Found" Error Occurred
Previously, the QR generator was referencing an undeployed Firebase Hosting domain (`https://bloodchain-95960.web.app/verify/<token>`). When scanned by external phones, Firebase naturally returned:
> **Firebase Hosting: Site Not Found**

Additionally, hardcoding `localhost` or `127.0.0.1` inside QR codes fails because mobile phones resolve `localhost` to themselves rather than the developer's laptop.

### Solution Architecture

BloodChain cleanly decouples development testing from production via configurable environment variables and an HTTPS development tunnel:

```
DEVELOPMENT / CROSS-DEVICE TESTING:
Mobile Phone (iPhone / Android)
       ↓ (Camera scan)
https://<public-tunnel-url>/verify/<secure-token>
       ↓ (Public Internet via Cloudflare HTTPS Tunnel)
Developer Laptop (Vite Dev Server :5173 / Docker :3000)
       ↓ (Nginx / Vite /api proxy)
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

## 🔒 Security Best Practices
- **Database Port Isolated**: PostgreSQL does not expose port 5432 externally by default; it is accessible exclusively within the internal `bloodchain_network`.
- **Non-Root Execution**: Backend runs under a dedicated unprivileged `bloodchain` system user.
- **Cryptographic Tokens**: BloodChain QR codes encode high-entropy UUIDv4 tokens (`/verify/<token>`). No personal identifiable information (PII) is exposed in the QR URL.
- **Backend Verification**: All verification queries are validated against the database ledger before returning donor and camp status.
