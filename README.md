# 🍲 SharePlate — Hyperlocal Real-Time Food Availability & Live GPS Map

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.3-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Zero--Config-003B57.svg?style=flat&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![PostGIS](https://img.shields.io/badge/PostGIS-Spatial--Ready-336791.svg?style=flat&logo=postgresql&logoColor=white)](https://postgis.net/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB.svg?style=flat&logo=python&logoColor=white)](https://www.python.org/)

SharePlate is a full-stack, real-time, GPS-driven hyperlocal food-sharing platform connecting household kitchens with nearby hungry neighbors. When a home cook finishes preparing a meal, a single click immediately broadcasts its real-time availability and approximate location onto nearby buyers' interactive live maps over persistent WebSockets.

The platform is designed with a strict **Privacy-First Architecture**: exact residential addresses, door numbers, and pickup instructions remain hidden behind an approximate neighborhood privacy perimeter (~160m jitter) and are unlocked exclusively to a buyer once a portion reservation is confirmed.

---

## 📑 Table of Contents

- [Critical Setup: Which Folder to Open](#-critical-setup-which-folder-to-open)
- [Project Overview](#-project-overview)
- [Features](#-features)
  - [Implemented Features](#implemented-features)
  - [Planned Features](#planned-features)
- [Technology Stack](#-technology-stack)
- [Project Folder Structure](#-project-folder-structure)
- [Prerequisites](#-prerequisites)
- [Installation and Setup](#-installation-and-setup)
- [Environment Configuration](#-environment-configuration)
- [Running the Application](#-running-the-application)
  - [Option 1: Development Mode (Hot-Reloading)](#option-1-development-mode-hot-reloading-recommended-for-development)
  - [Option 2: Unified Production Mode (Single Port 8000)](#option-2-unified-production-mode-single-port-8000)
- [Pre-Seeded Demo Accounts](#-pre-seeded-demo-accounts)
- [REST API and WebSocket Reference](#-rest-api-and-websocket-reference)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)

---

## 🚨 Critical Setup: Which Folder to Open

> [!IMPORTANT]
> **Open the project ROOT directory (`share-plate/`) in VS Code.**
> Do **NOT** open `backend/` or `frontend/` as the primary workspace root.

This repository is structured as a full-stack monorepo with distinct `backend/` and `frontend/` sub-applications coordinated from the root:
- The backend configuration (`run_app.py`, `.env.example`, `.env`) and local SQLite database (`hyperlocal_food.db`) reside in the **root directory**.
- Opening `share-plate/` ensures VS Code, terminal sessions, Git tracking, and environment files work synchronously without path errors.

### Step 1: Clone the Repository

Open your terminal or Windows PowerShell and clone the project:

```powershell
git clone https://github.com/seira-droid/share-plate.git
cd share-plate
```

### Step 2: Open the Root Folder in VS Code

Launch VS Code directly inside the cloned root directory:

```powershell
code .
```

Confirm that your VS Code Explorer displays:

```text
share-plate/
├── backend/
├── frontend/
├── .env.example
├── README.md
└── run_app.py
```

---

## 🎯 Project Overview

SharePlate bridges the gap between home kitchens producing fresh home-cooked meals and local residents seeking affordable, healthy, nearby food options.

```mermaid
flowchart TD
    subgraph Seller Kitchen
        S[Seller Kitchen] -->|Set GPS & List Dishes| POST_DISH["POST /food/listings (Status: Preparing)"]
        S -->|Click 'Food is Ready'| PATCH_READY["PATCH /food/listings/:id/status (Status: Ready)"]
    end

    subgraph Backend Engine & Geospatial Layer
        POST_DISH --> DB[(SQLite / PostgreSQL + PostGIS)]
        PATCH_READY --> DB
        DB --> WS[WebSocket Manager: Proximity Filter]
        WS -->|Live Broadcast Within Buyer Radius| PUB[Broadcast Live Event]
    end

    subgraph Buyer Interactive Map
        BUYER[Buyer Map View] -->|Subscribe GPS & Radius| SUB["ws://localhost:8000/ws/live-feed"]
        PUB -->|Instant Marker Update| SUB
        SUB -->|Live Pulsing Marker| MAP[MapLibre 3D / Leaflet View]
        MAP -->|Reserve Portion| RESERVE["POST /food/listings/:id/reserve"]
        RESERVE -->|Atomic Lock & Unlock| UNLOCKED[Private Pickup Address & Door Number Revealed]
    end
```

### Core Architecture Highlights

1. **Instant Availability Push**: When a cook clicks "Food is Ready", WebSocket events update nearby buyers' map markers immediately without page reloads or polling.
2. **Residential Privacy Obfuscation**: Sellers share surplus food from private homes. The public map displays a deterministic, jittered coordinate (~160m radius). The exact address and door instructions unlock only for verified buyers who complete a reservation.
3. **Atomic Portion Reservations**: Transactional reservation validation prevents race conditions and over-booking when multiple neighbors reserve the final portion simultaneously.
4. **Three Dedicated Role Portals**: Role-Based Access Control (RBAC) separates Buyer, Seller, and Admin workflows, backed by signed JWT authentication.

---

## 🌟 Features

### Implemented Features

- [x] **Interactive Live GPS Maps**:
  - Dual map engine support: 3D MapLibre GL (with 3D building extrusions and pitch/bearing controls) and Leaflet OpenStreetMap.
  - Distinct status-based visual markers:
    - 🟢 **Pulsing Green**: Food is Ready for immediate pickup.
    - 🟡 **Yellow**: Currently Preparing in the kitchen.
    - 🔵 **Blue**: Reserved by you or another neighbor.
    - ⚪ **Gray**: Sold Out / Completed.
  - Interactive radius circle overlay showing your active search perimeter.
- [x] **Geospatial Proximity & Radius Filtering**:
  - Distance computation via the spherical **Haversine formula**.
  - Search radius selection (1 km, 3 km, 5 km, 10 km).
  - Bounding-box pre-filtering in database queries for millisecond responses.
  - Automatic distance calculation and formatting (`X.X km away` or `X m away`) relative to buyer GPS.
- [x] **Residential Privacy Protection**:
  - Deterministic pseudo-random coordinate offset algorithm (`obfuscate_coordinates`) shifts exact kitchen coordinates by 100m–250m on the public discovery map.
  - Exact latitude, longitude, building/apartment address, and kitchen gate instructions remain locked until a confirmed reservation is created by the authenticated buyer.
- [x] **Real-Time WebSocket Feed (`/ws/live-feed`)**:
  - Live socket broadcasting for `listing_created`, `listing_status_changed`, `listing_reserved`, and `listing_cancelled`.
  - Spatial filtering on the server: listings are delivered exclusively to connected clients whose search radius covers the food location (with a 25% boundary buffer for map panning).
  - Automatic reconnect with exponential backoff and initial state resynchronization.
- [x] **Role-Based Access Control (RBAC) & Authentication**:
  - Secure PBKDF2-HMAC-SHA256 password hashing with unique per-user salts.
  - Signed HS256 JWT access tokens.
  - Three distinct roles: `BUYER`, `SELLER`, `ADMIN`.
  - In-app demo switcher in navbar for testing all roles seamlessly.
- [x] **Seller Kitchen Management**:
  - Custom listing creator with portion size, meal type (Breakfast, Lunch, Dinner, Snacks), spice level, dietary tags, price, and exact GPS coordinates.
  - One-click availability toggle from "Preparing" to "Food is Ready".
  - Real-time inventory deduction and active reservation tracking.
- [x] **Buyer Discovery & Reservations**:
  - Keyword search across dishes, ingredients, and seller kitchen names.
  - Category filters: Kerala Homestyle, Biryani & Rice, Evening Snacks & Chaat, Sweets & Desserts, Healthy & Salads.
  - One-click portion reservation with instant address unlocking and seller phone reveal.
  - Reservation cancellation with automatic portion restoration.
- [x] **Admin Moderation & Governance**:
  - Administrative dashboard at `/admin/overview` with system metrics (total users, active sellers, available listings, ready portions).
  - Seller kitchen verification and account suspension/reactivation.
  - Emergency food listing removal.
  - Community moderation report filing and tracking.
- [x] **Pre-Seeded Sample Data**:
  - Automatic seeding of authentic Kerala homemade food listings (Malabar Biryani, Kerala Meals, Appam with Stew, etc.) centered around Kochi (Panampilly Nagar, Ravipuram, Kadavanthra, Marine Drive) on initial launch.

### Planned Features

- [ ] Integrated online payments via UPI / Stripe / Razorpay (currently supports cash / UPI on pickup).
- [ ] Push notifications via Web Push API for subscribed favorite home chefs.
- [ ] Peer-to-peer volunteer delivery dispatch for elderly or mobility-impaired neighbors.
- [ ] PostGIS automated database spatial partitioning for multi-city scale.

---

## 💻 Technology Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Python** | `3.10+` (tested on 3.12) | Core runtime environment |
| **FastAPI** | `^0.110.0` | High-performance asynchronous REST API framework |
| **Uvicorn** | `^0.28.0` | ASGI production server |
| **SQLAlchemy** | `^2.0.0` | ORM for database operations and relationships |
| **SQLite** | Built-in | Default zero-configuration embedded database (`hyperlocal_food.db`) |
| **PostgreSQL + PostGIS** | Optional | Supported spatial database for production deployments |
| **Pydantic** | `^2.6.0` | Request and response schema validation |
| **PyJWT** | `^2.8.0` | Signed HS256 JSON Web Tokens for authentication |
| **WebSockets** | `^12.0` | Low-latency bi-directional real-time feed |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | `^19.3.1` | Modern component-based user interface |
| **TypeScript** | `~7.0.2` | Complete static typing and interface definitions |
| **Vite** | `^8.3.5` | Next-generation frontend build tool and dev server |
| **Tailwind CSS** | `^4.3.3` | Utility-first CSS styling |
| **MapLibre GL** | `^6.16.0` | 3D vector map engine with extruded buildings |
| **Leaflet** | `^1.9.4` | Fallback lightweight interactive OpenStreetMap mapping |
| **Lucide React** | `^1.64.0` | UI icon pack |

### Testing & Tooling
| Technology | Version | Purpose |
|---|---|---|
| **Pytest** | `^8.0.0` | Automated backend unit and integration test runner |
| **HTTPX** | `^0.27.0` | Asynchronous HTTP client for FastAPI TestClient |
| **Oxlint** | `^1.89.0` | High-performance JavaScript/TypeScript linter |

---

## 📁 Project Folder Structure

```text
share-plate/
├── .env.example                     # Environment template (copy to .env in root)
├── .gitignore                       # Ignored files (venv, node_modules, dist, *.db)
├── README.md                        # Project documentation (this file)
├── run_app.py                       # Single-command application entry point
├── hyperlocal_food.db               # SQLite database file (auto-created on first run)
│
├── backend/                         # FastAPI Application Backend
│   ├── __init__.py
│   ├── auth_security.py             # PBKDF2 hashing, JWT issue/verify, RBAC guards
│   ├── database.py                  # SQLAlchemy engine, session maker, get_db dependency
│   ├── geospatial.py                # Haversine distance, bounding box, coordinate obfuscation
│   ├── main.py                      # FastAPI app entry point, lifespan, CORS, static mount
│   ├── models.py                    # SQLAlchemy ORM models (User, Listing, Reservation, etc.)
│   ├── requirements.txt             # Python backend dependencies
│   ├── schemas.py                   # Pydantic models for request/response serialization
│   ├── seed_data.py                 # Initial Kerala sample listings generator
│   ├── websocket_manager.py         # Real-time WebSocket connection manager & spatial filtering
│   │
│   ├── migrations/                  # Database migration scripts
│   │   └── schema_postgis.sql       # Optional PostgreSQL + PostGIS schema with spatial indexes
│   │
│   ├── routes/                      # API Route Handlers
│   │   ├── admin.py                 # Admin metrics, seller verification, listing moderation
│   │   ├── auth.py                  # User registration, login, demo switchers, /auth/me
│   │   └── food.py                  # Listing CRUD, /food/nearby, reservations, status updates
│   │
│   ├── test_api.py                  # Pytest: Haversine, privacy obfuscation, lifecycle
│   ├── test_e2e_realtime.py         # Pytest: Real-time WebSocket event delivery
│   └── test_rbac_and_features.py    # Pytest: Role restrictions and admin moderation
│
└── frontend/                        # Vite + React 19 + TypeScript Frontend
    ├── index.html                   # Single Page Application HTML template
    ├── package.json                 # Node dependencies and scripts
    ├── package-lock.json            # Exact dependency lockfile
    ├── tsconfig.json                # TypeScript project configuration
    ├── vite.config.ts               # Vite configuration with API and WebSocket proxies
    │
    ├── public/                      # Static assets and map workers
    │   └── maplibre-gl-worker.mjs   # MapLibre offline web worker script
    │
    └── src/                         # React Application Source Code
        ├── main.tsx                 # React DOM mount entry point
        ├── App.tsx                  # Root application component and state orchestration
        ├── index.css                # Tailwind CSS v4 styling rules
        ├── types.ts                 # Shared TypeScript interfaces (User, Listing, etc.)
        │
        ├── components/              # UI Components
        │   ├── Navbar.tsx           # Navigation bar with role switchers and demo logins
        │   ├── BuyerDashboard.tsx   # Buyer feed, search, filter controls, reservations drawer
        │   ├── BuyerDiscovery.tsx   # Discovery listing cards
        │   ├── BuyerMap.tsx         # Leaflet OpenStreetMap view
        │   ├── MapLibre3DMap.tsx    # MapLibre 3D vector map view with pitch & extrusions
        │   ├── SellerDashboard.tsx  # Kitchen manager, listing creation modal, status toggles
        │   ├── AdminDashboard.tsx   # Platform analytics, seller approval, report moderation
        │   ├── AuthModal.tsx        # Registration and login modal with GPS picker
        │   └── FoodDetailModal.tsx  # Dish detail popup, privacy lock, 1-click reservation
        │
        ├── hooks/                   # Custom React Hooks
        │   ├── useGeolocation.ts    # HTML5 Geolocation hook with fallback presets
        │   └── useRealtimeFeed.ts   # WebSocket hook with auto-reconnect and subscriptions
        │
        └── services/
            └── api.ts               # Frontend REST client with JWT header management
```

---

## ⚙️ Prerequisites

Before getting started, make sure the following software is installed on your computer:

1. **Python**: `3.10` or higher (verified on Python `3.12.x`).
   - Verify: `python --version`
2. **Node.js**: `18.x`, `20.x`, or `24.x`.
   - Verify: `node --version`
3. **npm**: Bundled with Node.js (`v9.x` to `v11.x`).
   - Verify: `npm --version`
4. **Git**:
   - Verify: `git --version`
5. *(Optional)* **PostgreSQL with PostGIS**: Only required if deploying with PostGIS instead of the built-in SQLite engine.

---

## 🚀 Installation and Setup

Follow these exact steps from your terminal (Windows PowerShell commands shown).

### Step 1: Open the Cloned Root Folder

Ensure your terminal prompt is at the project root directory:

```powershell
cd share-plate
```

### Step 2: Set Up Python Virtual Environment

Create and activate a virtual environment in the project root:

```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment on Windows PowerShell:
.\venv\Scripts\Activate.ps1
```

> [!NOTE]
> If Windows PowerShell displays an execution policy error such as `cannot be loaded because running scripts is disabled`, run this command in your PowerShell session:
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
> .\venv\Scripts\Activate.ps1
> ```
> *On macOS / Linux, activate with:* `source venv/bin/activate`

### Step 3: Install Backend Dependencies

With `(venv)` active, install the required Python packages:

```powershell
pip install -r backend/requirements.txt
```

### Step 4: Install Frontend Dependencies

Navigate into the `frontend/` directory and install the Node packages using `npm`:

```powershell
cd frontend
npm install
cd ..
```

*(You are now back in the root directory).*

### Step 5: Configure the Environment File

Copy the provided `.env.example` file to create your `.env` in the root directory:

```powershell
# Windows PowerShell:
Copy-Item .env.example .env

# On macOS / Linux:
# cp .env.example .env
```

The default configuration in `.env` is pre-configured to run with zero additional setup using local SQLite.

---

## 🔐 Environment Configuration

The application reads its environment configuration from the `.env` file located in the **project root directory**:

```text
share-plate/.env
```

### Environment Variables Reference

| Variable | Default Value | Description | Required? |
|---|---|---|---|
| `DATABASE_URL` | `sqlite:///./hyperlocal_food.db` | SQLAlchemy connection string. Default uses local SQLite. For PostgreSQL with PostGIS, use: `postgresql://user:password@localhost:5432/dbname` | No (defaults to SQLite) |
| `HOST` | `0.0.0.0` | Network interface IP to bind the backend server | No |
| `PORT` | `8000` | Port for the backend API and production server | No |
| `ENVIRONMENT` | `development` | Environment mode (`development` or `production`) | No |
| `WS_HEARTBEAT_INTERVAL` | `25` | Interval in seconds for WebSocket ping/pong keepalive | No |
| `OBFUSCATION_RADIUS_METERS`| `160` | Residential privacy jitter distance buffer applied to public coordinates | No |
| `JWT_SECRET` | *(Internal default)* | Secret key used to sign HS256 JWT tokens. Set a random string in production | Recommended for production |

### Database Setup & Migrations

- **SQLite (Default — Zero-Config)**:
  - No database installation or manual migration commands are required!
  - When the FastAPI backend starts, SQLAlchemy automatically checks the database schema, creates all tables (`users`, `seller_profiles`, `food_listings`, `reservations`, `notifications`, `reports`), and seeds the demo users and Kerala sample dishes if empty.
- **PostgreSQL + PostGIS (Optional for Production)**:
  - To use PostgreSQL with PostGIS spatial indexing, update `DATABASE_URL` in `.env`:
    ```ini
    DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/hyperlocal_food
    ```
  - Run the provided SQL migration in `backend/migrations/schema_postgis.sql`:
    ```powershell
    psql -U postgres -d hyperlocal_food -f backend/migrations/schema_postgis.sql
    ```

---

## 🏃 Running the Application

You can run SharePlate in either of two modes:

---

### Option 1: Development Mode (Hot-Reloading) *(Recommended for Development)*

Running in development mode enables Vite's fast hot module replacement (HMR) for frontend edits and Uvicorn's reload for backend updates. This mode requires **two terminal windows**.

#### Terminal 1: Backend Server (Run from project root)

```powershell
# 1. Ensure you are in the root directory:
cd share-plate

# 2. Activate virtual environment:
.\venv\Scripts\Activate.ps1

# 3. Start the FastAPI backend:
python run_app.py
```

The backend starts at `http://localhost:8000`.

#### Terminal 2: Frontend Dev Server (Run from `frontend/` directory)

Open a second terminal window:

```powershell
# 1. Navigate to the frontend directory:
cd share-plate\frontend

# 2. Start the Vite development server:
npm run dev
```

> [!TIP]
> If PowerShell blocks `npm`, run: `npm.cmd run dev`

Open your browser at:
👉 **[http://localhost:5173](http://localhost:5173)**

*Note: In development mode, the Vite server on port 5173 automatically proxies `/food`, `/auth`, and `/ws` to the backend on `http://127.0.0.1:8000`.*

---

### Option 2: Unified Production Mode (Single Port 8000)

In production mode, the compiled frontend is packaged into `frontend/dist` and served directly by the FastAPI backend under the single port `8000`.

#### Step 1: Build the Frontend (Run from `frontend/` directory)

```powershell
cd share-plate\frontend
npm run build
cd ..
```

*(This compiles the React application into `frontend/dist`).*

#### Step 2: Start the Unified Application (Run from project root)

```powershell
cd share-plate
.\venv\Scripts\Activate.ps1
python run_app.py
```

Open your browser at:
👉 **[http://localhost:8000](http://localhost:8000)**

---

## 👥 Pre-Seeded Demo Accounts

The application automatically seeds ready-to-use demo accounts so you can test all roles immediately without registering manually.

> [!TIP]
> You can switch between active demo identities directly using the **Demo Switcher dropdown in the top navigation bar**, or log in using the credentials below via the "Sign In" button:

### 1. Administrator Account
- **Email**: `admin@foodnearby.in`
- **Password**: `Admin@FoodNearby2026`
- **Role**: `ADMIN`
- **Permissions**: Access the Admin Dashboard via the navbar pill to inspect platform KPIs, approve/suspend seller kitchens, delete listings, and review reports.

### 2. Verified Household Sellers (Home Kitchens)
- **Lakshmi Menon** (Lakshmi's Traditional Kitchen — Panampilly Nagar, Kochi)
  - **Email**: `lakshmi.menon@foodnearby.in`
  - **Password**: `Demo@Password123`
- **Suresh Babu** (Suresh's Spice Kitchen — Ravipuram, Kochi)
  - **Email**: `suresh.babu@foodnearby.in`
  - **Password**: `Demo@Password123`
- **Divya Nair** (Divya's Appam Corner — Girinagar, Kadavanthra, Kochi)
  - **Email**: `divya.nair@foodnearby.in`
  - **Password**: `Demo@Password123`

### 3. Hungry Neighbors (Buyers)
- **Ananya Menon**
  - **Email**: `ananya.menon@foodnearby.in`
  - **Password**: `Demo@Password123`
- **Arjun Nair**
  - **Email**: `arjun.nair@foodnearby.in`
  - **Password**: `Demo@Password123`
- **Priya Sharma**
  - **Email**: `priya.sharma@foodnearby.in`
  - **Password**: `Demo@Password123`

---

## 📡 REST API and WebSocket Reference

FastAPI provides interactive Swagger documentation. When the backend is running, visit:
👉 **[http://localhost:8000/docs](http://localhost:8000/docs)**

### Key REST Endpoints

| Method | Endpoint | Description | Access Level |
|---|---|---|---|
| `GET` | `/food/nearby` | Retrieve available food listings within a radius (returns obfuscated coordinates) | Public |
| `POST` | `/food/listings` | Create a food listing with kitchen coordinates, portion size, and meal type | Sellers & Admin |
| `PATCH` | `/food/listings/{id}/status` | Toggle listing status (`preparing`, `ready`, `sold_out`) | Seller owner |
| `GET` | `/food/listings/{id}` | Listing details (exact address unlocked only if buyer has confirmed reservation) | Authenticated |
| `POST` | `/food/listings/{id}/reserve` | Atomically reserve portions and unlock seller pickup address | Buyers |
| `POST` | `/food/listings/{id}/cancel` | Cancel an active reservation and restore portions | Buyer or Seller |
| `GET` | `/food/my-listings` | Retrieve listings created by current seller | Seller |
| `GET` | `/food/my-reservations` | Retrieve reservations made by current buyer | Buyer |
| `POST` | `/food/seed` | Seed test homemade dishes around a given GPS coordinate | Admin / Testing |
| `POST` | `/auth/register/buyer` | Register as a buyer | Public |
| `POST` | `/auth/register/seller` | Register as a household seller with kitchen details | Public |
| `POST` | `/auth/login` | Authenticate with email/password and obtain JWT token | Public |
| `POST` | `/auth/admin-login` | Authenticate with administrator credentials | Admin |
| `GET` | `/auth/me` | Fetch profile information for the current user session | Authenticated |
| `GET` | `/admin/overview` | Platform KPI statistics (total users, active listings, etc.) | Admin only |
| `PATCH`| `/admin/sellers/{id}/verify` | Approve or suspend a seller's kitchen | Admin only |
| `DELETE`| `/admin/listings/{id}` | Remove a food listing from the platform | Admin only |
| `POST` | `/admin/reports` | Submit an issue report against a listing or seller | Authenticated |

### WebSocket Live Feed

- **URL**: `ws://localhost:8000/ws/live-feed?user_id=<user_id>`
- **Subscribe Location Filter**:
  Send a JSON message over the socket:
  ```json
  {
    "type": "subscribe_location",
    "lat": 9.9625,
    "lng": 76.2990,
    "radius_km": 5.0
  }
  ```
- **Events Emitted by Server**:
  - `listing_created`: New food listing published in your area.
  - `listing_status_changed`: Cook updated dish status (e.g. to `ready` or `sold_out`).
  - `listing_reserved`: Portions remaining updated in real-time.
  - `listing_cancelled`: Portions restored.

---

## 🧪 Testing

The repository includes a comprehensive automated test suite verifying distance calculations, privacy obfuscation, race condition prevention, WebSocket live broadcasts, and Role-Based Access Control.

### Run Backend Pytest Suite

From the project **root directory**:

```powershell
cd share-plate
.\venv\Scripts\Activate.ps1
python -m pytest backend/ -v
```

### Verified Test Cases (12/12 Passing)

1. `test_haversine_distance`: Accuracy of geodesic distance calculations.
2. `test_coordinate_obfuscation`: Ensures public coordinates stay within a ~100m–250m jitter buffer without exposing exact home coordinates.
3. `test_radius_and_category_filtering`: Confirms listings outside the search radius (e.g., 18km away) do not leak into 3km queries.
4. `test_unauthorized_status_update_denied`: Prevents unauthorized users from tampering with food statuses (returns HTTP 403 Forbidden).
5. `test_out_of_stock_and_double_reservation_prevention`: Verifies atomic locking against simultaneous double-reservations.
6. `test_full_seller_buyer_lifecycle`: Complete lifecycle: create listing -> discover -> mark ready -> reserve -> address unlock -> cancel.
7. `test_websocket_realtime_e2e_broadcast`: Real-time WebSocket verification: client receives live broadcast immediately when seller clicks "Food is Ready".
8. `test_separate_buyer_and_seller_registration`: Validates distinct registration contracts for buyers and sellers.
9. `test_admin_login_and_rbac_restrictions`: Enforces strict RBAC (buyers and sellers receive 403 Forbidden on admin endpoints).
10. `test_buyer_forbidden_from_creating_listing`: Buyers are prevented from posting listings.
11. `test_seller_lifecycle_and_buyer_reservation`: End-to-end seller dish creation and buyer reservation with address reveal.
12. `test_admin_seller_moderation_and_listing_removal`: Tests administrative seller suspension and account reactivation.

### Frontend Type Check & Build Verification

From the `frontend/` directory:

```powershell
cd share-plate\frontend
npm run build
```

This executes `tsc -b && vite build` to ensure 100% TypeScript type safety.

---

## 🛠️ Troubleshooting

### 1. PowerShell Script Execution Policy Error
**Symptom**: `File ...\Activate.ps1 cannot be loaded because running scripts is disabled on this system` or `npm.ps1 cannot be loaded`.  
**Solution**: Windows PowerShell restricts script execution by default. Run:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```
Then re-run the activation script. For npm commands, you can also use `npm.cmd` directly:
```powershell
npm.cmd run dev
```

### 2. Frontend returns 404 when opening `http://localhost:8000`
**Symptom**: Opening `http://localhost:8000` returns `{"detail":"Not Found"}`.  
**Cause**: The compiled production build (`frontend/dist`) has not been generated yet (`dist` is intentionally gitignored).  
**Solution**:
- If developing, run the frontend dev server via `cd frontend && npm run dev` and view at **`http://localhost:5173`**.
- If running unified production mode, build the frontend first:
  ```powershell
  cd frontend
  npm run build
  cd ..
  python run_app.py
  ```

### 3. Port Already in Use (Port 8000 or 5173)
**Symptom**: `[Errno 10048] error while attempting to bind on address ('0.0.0.0', 8000)`  
**Solution**: An earlier instance of Python or Uvicorn is still running. On Windows PowerShell, find and terminate it:
```powershell
Get-Process | Where-Object {$_.ProcessName -match "python"} | Stop-Process -Force
```
Alternatively, specify a different port in `.env` (`PORT=8001`) or run:
```powershell
python -m uvicorn backend.main:app --port 8001
```

### 4. SQLite Database Locked Error
**Symptom**: `sqlite3.OperationalError: database is locked`  
**Cause**: Occurs if multiple background processes are writing to `hyperlocal_food.db` simultaneously.  
**Solution**: Stop any background test runners or secondary Uvicorn instances before restarting the app.

### 5. Browser Geolocation Prompt Denied
**Symptom**: Browser refuses GPS access.  
**Solution**: The application includes built-in fallback handling (`useGeolocation.ts`). If GPS permissions are denied or unavailable in your desktop browser, SharePlate automatically defaults to the preset Kerala coordinates (**Panampilly Nagar, Kochi: 9.9625, 76.2990**), allowing you to test nearby discovery and map features without interruption.

---

## 📄 License

This project is licensed under the MIT License.
