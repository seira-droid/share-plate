import json
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import engine, Base, SessionLocal, get_db
from .models import User, FoodListing
from .routes.auth import router as auth_router, init_demo_users
from .routes.food import router as food_router
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
        init_demo_users(db)
        
        # If database is empty, seed initial sample Indian dishes around Bengaluru coordinates (12.9716, 77.5946)
        existing_count = db.query(FoodListing).count()
        if existing_count == 0:
            logger.info("Seeding initial Indian homemade dishes around coordinates (12.9716, 77.5946)...")
            seed_sample_listings(db, center_lat=12.9716, center_lon=77.5946)
    finally:
        db.close()
        
    yield
    logger.info("Shutting down application...")

app = FastAPI(
    title="Hyperlocal Food Availability & Live GPS Tracking API",
    description="Real-time peer-to-peer household food sharing marketplace with GPS-based live tracking, proximity filtering, and residential privacy obfuscation.",
    version="1.0.0",
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

@app.get("/api/info")
def root_info():
    return {
        "status": "online",
        "service": "Hyperlocal Food Availability & Tracking API",
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

