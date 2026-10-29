# 🍲 SharePlate — Hyperlocal Real-Time Food Availability & Live GPS Map

A real-time, GPS-driven hyperlocal food-sharing marketplace connecting household kitchens with nearby hungry neighbors. Households list surplus home-cooked food, and when a dish is ready, one click immediately broadcasts its availability and location onto nearby buyers' interactive live maps via WebSockets.

---

## 🌟 Key Capabilities

1. **Live GPS-Based Availability Engine**:
   - Real-time Leaflet & OpenStreetMap interactive buyer map.
   - Distinctive status markers:
     - 🟢 **Green Marker with Pulse Animation**: Food Ready for Pickup.
     - 🟡 **Yellow Marker**: Currently Preparing.
     - 🔵 **Blue Marker**: Reserved.
     - ⚪ **Grey Marker**: Sold Out.
   - Automatic marker synchronization over persistent WebSockets without page reloads.

2. **Geospatial Proximity & Radius Filtering**:
   - Geodesic distance calculation via the Haversine formula (and PostGIS `ST_DWithin` support).
   - Configurable search radii (1 km, 3 km, 5 km, 10 km).
   - Nearest available food locations sorted and rendered first.
   - Bounding-box database query acceleration for millisecond responses.

3. **Household Residential Privacy Protection**:
   - **Crucial Privacy Shield**: Exact household door numbers and precise residential coordinates are **never exposed publicly**.
   - Public map displays deterministic approximate neighborhood coordinates (~150m radius).
   - The exact house address, apartment number, and seller pickup instructions unlock **only after a confirmed reservation**.

4. **Real-Time Communication Architecture**:
   - FastAPI WebSocket hub at `/ws/live-feed`.
   - Spatial filtering: broadcasts events only to connected clients within the listing's proximity.
   - Automatic reconnect with exponential backoff and initial state resynchronization.

5. **Atomic Double-Booking Prevention**:
   - Transactional locking (`SELECT ... FOR UPDATE`) guarantees zero race conditions or double reservations when portions sell out simultaneously.

---

## 🏗️ Architecture Overview

```mermaid
flowchart TD
    subgraph Seller Experience
        S[Seller Kitchen] -->|Captures GPS & Creates Listing| POST_LISTING[POST /food/listings]
        S -->|Clicks FOOD IS READY| PATCH_READY[PATCH /food/listings/id/status]
    end

    subgraph Backend & Real-Time Engine
        POST_LISTING --> DB[(Database: SQLite / PostGIS)]
        PATCH_READY --> DB
        DB --> WS_MGR[WebSocket Connection Manager]
        WS_MGR -->|Geospatial Filter: Proximity Check| BROADCAST[Broadcast Real-Time Event]
    end

    subgraph Buyer Experience
        BUYER[Buyer Interactive Map] -->|Subscribe GPS & Radius| WS_CONN[/ws/live-feed]
        BROADCAST -->|Live Event| WS_CONN
        WS_CONN -->|Instant Marker Update| LIVE_MAP[Leaflet OpenStreetMap View]
        LIVE_MAP -->|1-Click Reserve| RESERVE[POST /food/listings/id/reserve]
        RESERVE -->|Unlocks Exact Address| UNLOCKED[Private Pickup Address Revealed]
    end
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ (Node 24 recommended)
- `npm`

### 1. Run the Complete Application (Single Command)
The built production frontend is embedded directly within FastAPI:

```bash
cd "C:\Users\SEIRA ELSA BIJU\.gemini\antigravity\scratch\hyperlocal-food-marketplace"
python run_app.py
```

Open your browser at:
- **Web Application**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger REST API**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Live WebSocket Feed**: `ws://localhost:8000/ws/live-feed`

### 2. Frontend Development Mode (Hot Reload)
To run the Vite React dev server concurrently with hot module replacement:

```bash
# Terminal 1: Backend
python run_app.py

# Terminal 2: Frontend
cd frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173). Requests to `/food`, `/auth`, and `/ws` automatically proxy to the backend on port 8000.

---

## 🧪 Automated Test Suite

Run the comprehensive pytest suite verifying all REST endpoints, Haversine distance, privacy obfuscation, concurrency locks, and end-to-end WebSocket event propagation:

```bash
python -m pytest backend/ -v
```

### Test Coverage Highlights:
- `test_haversine_distance`: Accuracy of geodesic distance calculations.
- `test_coordinate_obfuscation`: Ensures public coordinates stay within ~100-250m buffer without leaking exact home location.
- `test_radius_and_category_filtering`: Confirms 15km food does not leak into 3km radius queries.
- `test_unauthorized_status_update_denied`: Prevents unauthorized users from tampering with food statuses (403 Forbidden).
- `test_out_of_stock_and_double_reservation_prevention`: Transactional verification against race conditions.
- `test_full_seller_buyer_lifecycle`: Full cycle: create -> discover -> ready -> reserve -> unlock address -> cancel.
- `test_websocket_realtime_e2e_broadcast`: WebSocket client receives instant live broadcast when seller clicks "FOOD IS READY".

---

## 📡 REST API Reference

| Method | Endpoint | Description | Auth / Privacy |
|---|---|---|---|
| `GET` | `/food/nearby` | Retrieve available food within geographical radius | Public (Approx coordinates returned) |
| `POST` | `/food/listings` | Create food listing with seller GPS | Seller authenticated |
| `PATCH` | `/food/listings/{id}/status` | Update availability (`ready`, `preparing`, etc.) | Seller authorized |
| `GET` | `/food/listings/{id}` | Complete listing details | Unlocks exact address if reserved |
| `POST` | `/food/listings/{id}/reserve` | Reserve portion of food | Buyer authenticated |
| `POST` | `/food/listings/{id}/cancel` | Cancel active reservation | Buyer or Seller authorized |
| `GET` | `/food/my-listings` | Seller kitchen dashboard listings | Seller authenticated |
| `GET` | `/food/my-reservations` | Buyer active reservations & pickups | Buyer authenticated |
| `POST` | `/food/seed` | Seed test homemade dishes around GPS pin | Testing helper |

---

## 🛡️ Privacy & Security Design

Household food sharing requires strict privacy protections:
1. **Coordinate Perturbation**: Sellers provide their exact residential GPS coordinates. The system generates a deterministic obfuscated coordinate (~160m jitter):
   ```python
   approx_lat, approx_lon = obfuscate_coordinates(exact_lat, exact_lon, listing_id)
   ```
2. **Access Control Layer**:
   - `GET /food/nearby` always returns `approx_latitude`, `approx_longitude`, and `approx_location_name`.
   - `GET /food/listings/{id}` checks if `current_user.id == listing.seller_id` OR has a `CONFIRMED` reservation in the database.
   - Only when verified does the response deliver `exact_latitude`, `exact_longitude`, `pickup_address`, and `pickup_instructions`.

