import json
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import engine, Base, SessionLocal, get_db
from .models import User, FoodListing
from .routes.auth import router as auth_router, init_demo_identities
from .routes.food import router as food_router
from .routes.admin import router as admin_router
from .websocket_manager import ws_manager
from .seed_data import seed_sample_listings

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("hyperlocal-food-api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed default users
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        init_demo_identities(db)
        
        # If database is empty, seed initial sample Kerala homemade food around Panampilly Nagar Kochi (9.9625, 76.2990)
        existing_count = db.query(FoodListing).count()
        if existing_count == 0:
            logger.info("Seeding initial Kerala sample homemade dishes around coordinates (9.9625, 76.2990)...")
            seed_sample_listings(db, center_lat=9.9625, center_lon=76.2990)
    finally:
        db.close()
        
    yield
    logger.info("Shutting down application...")

app = FastAPI(
    title="Hyperlocal Food Availability & Live GPS Tracking API",
    description="Real-time peer-to-peer household food sharing marketplace with RBAC (Buyer, Seller, Admin), live 3D GPS tracking, proximity filtering, and residential privacy obfuscation.",
    version="2.0.0",
    lifespan=lifespan
)

# CORS setup for Vite frontend & cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API routers
app.include_router(auth_router)
app.include_router(food_router)
app.include_router(admin_router)

@app.get("/api/info")
def root_info():
    return {
        "status": "online",
        "service": "Hyperlocal Food Availability & Tracking API",
        "version": "2.0.0",
        "docs": "/docs",
        "ws_endpoint": "/ws/live-feed"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# -------------------------------------------------------------
# WebSocket Live-Feed Endpoint
# -------------------------------------------------------------
@app.websocket("/ws/live-feed")
async def websocket_live_feed(websocket: WebSocket, user_id: str = "guest"):
    sub = await ws_manager.connect(websocket, user_id=user_id)
    try:
        # Send initial connection acknowledgment
        await websocket.send_text(json.dumps({
            "event": "connected",
            "message": "Connected to Hyperlocal Food Live GPS Feed",
            "user_id": user_id
        }))

        while True:
            raw_text = await websocket.receive_text()
            try:
                msg = json.loads(raw_text)
                msg_type = msg.get("type") or msg.get("action")

                if msg_type == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))

                elif msg_type == "subscribe_location":
                    lat = float(msg.get("lat", 0.0))
                    lon = float(msg.get("lng") or msg.get("lon", 0.0))
                    radius_km = float(msg.get("radius_km", 10.0))
                    ws_manager.update_location_filter(sub, lat, lon, radius_km)
                    await websocket.send_text(json.dumps({
                        "event": "filter_updated",
                        "lat": lat,
                        "lon": lon,
                        "radius_km": radius_km
                    }))

            except json.JSONDecodeError:
                pass

    except WebSocketDisconnect:
        ws_manager.disconnect(sub)
    except Exception as e:
        logger.warning(f"WebSocket client error: {e}")
        ws_manager.disconnect(sub)

# Mount frontend build at the very end so API & WebSockets take precedence
import os
from fastapi.staticfiles import StaticFiles

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static-frontend")
