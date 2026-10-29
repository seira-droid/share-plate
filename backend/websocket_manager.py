import json
import logging
from typing import Dict, List, Optional
from fastapi import WebSocket
from .geospatial import haversine_distance_km

logger = logging.getLogger("websocket_manager")

class ClientSubscription:
    def __init__(self, websocket: WebSocket, user_id: Optional[str] = None):
        self.websocket = websocket
        self.user_id = user_id
        self.lat: Optional[float] = None
        self.lon: Optional[float] = None
        self.radius_km: Optional[float] = None

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[ClientSubscription] = []

    async def connect(self, websocket: WebSocket, user_id: Optional[str] = None) -> ClientSubscription:
        await websocket.accept()
        sub = ClientSubscription(websocket, user_id)
        self.active_connections.append(sub)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")
        return sub

    def disconnect(self, sub: ClientSubscription):
        if sub in self.active_connections:
            self.active_connections.remove(sub)
            logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    def update_location_filter(self, sub: ClientSubscription, lat: float, lon: float, radius_km: float):
        sub.lat = lat
        sub.lon = lon
        sub.radius_km = radius_km
        logger.info(f"Client location filter updated: ({lat}, {lon}) radius={radius_km}km")

    async def broadcast_listing_event(
        self,
        event_type: str,
        listing_data: dict,
        listing_lat: Optional[float] = None,
        listing_lon: Optional[float] = None
    ):
        """
        Broadcast real-time listing event to connected clients.
        If client has specified a GPS location and radius, only deliver if within radius
        (with a generous 20% margin for map viewport panning), or if client has no filter.
        """
        payload = json.dumps({
            "event": event_type,
            "data": listing_data
        }, default=str)

        disconnected: List[ClientSubscription] = []
        for sub in list(self.active_connections):
            # Check proximity if client has active GPS filter and listing has coords
            should_send = True
            if (listing_lat is not None and listing_lon is not None and
                sub.lat is not None and sub.lon is not None and sub.radius_km is not None):
                dist = haversine_distance_km(sub.lat, sub.lon, listing_lat, listing_lon)
                # Allow a 25% boundary buffer so markers just outside viewport update smoothly
                if dist > (sub.radius_km * 1.25):
                    should_send = False

            if should_send:
                try:
                    await sub.websocket.send_text(payload)
                except Exception as e:
                    logger.warning(f"Error sending to WebSocket client: {e}")
                    disconnected.append(sub)

        for sub in disconnected:
            self.disconnect(sub)

ws_manager = ConnectionManager()
