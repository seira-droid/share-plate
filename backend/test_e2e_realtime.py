import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import Base, engine, SessionLocal
from backend.routes.auth import init_demo_users

def test_websocket_realtime_e2e_broadcast():
    client = TestClient(app)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    init_demo_users(db)
    db.close()

    # 1. Connect WebSocket client representing Buyer Charlie
    with client.websocket_connect("/ws/live-feed?user_id=buyer-charlie") as ws:
        # Initial connect message
        init_msg = ws.receive_json()
        assert init_msg.get("event") == "connected"

        # Subscribe to buyer's current coordinates (Indiranagar Bengaluru)
        ws.send_json({
            "type": "subscribe_location",
            "lat": 12.9784,
            "lng": 77.6408,
            "radius_km": 5.0
        })
        filter_ack = ws.receive_json()
        assert filter_ack.get("event") == "filter_updated"

        # 2. Seller Alice creates a new dish
        seller_headers = {"X-User-Id": "seller-alice"}
        create_res = client.post("/food/listings", json={
            "food_name": "Hot Artisanal Kerala Porotta & Roast",
            "description": "Slow cooked pepper chicken roast with 3 flaky porottas",
            "category": "Kerala Homestyle",
            "house_label": "House #14B (Amma's Kitchen)",
            "portion_size": "3 Porottas + 250ml Curry",
            "items_included": "3 Porottas, Chicken Roast, Onion Salad",
            "quantity_available": 4,
            "price": 160.0,
            "currency": "₹",
            "status": "preparing",
            "latitude": 12.9785,
            "longitude": 77.6410,
            "pickup_address": "Flat 2A, 10 Indiranagar Main Road",
            "approx_location_name": "Indiranagar 1st Stage",
            "pickup_instructions": "Gate buzzer 2A. Still on the tawa."
        }, headers=seller_headers)
        assert create_res.status_code == 201
        listing_data = create_res.json()
        listing_id = listing_data["id"]

        # Buyer Charlie receives real-time listing_created event over WebSocket!
        ws_event_1 = ws.receive_json()
        assert ws_event_1.get("event") == "listing_created"
        assert ws_event_1["data"]["id"] == listing_id
        assert ws_event_1["data"]["food_name"] == "Hot Artisanal Kerala Porotta & Roast"
        assert ws_event_1["data"]["portion_size"] == "3 Porottas + 250ml Curry"
        assert ws_event_1["data"]["status"] == "preparing"
        assert ws_event_1["data"]["is_exact_location"] is False

        # 3. Seller Alice marks "FOOD IS READY"
        status_res = client.patch(
            f"/food/listings/{listing_id}/status",
            json={"status": "ready"},
            headers=seller_headers
        )
        assert status_res.status_code == 200

        # Buyer Charlie receives immediate real-time listing_status_changed event over WebSocket!
        ws_event_2 = ws.receive_json()
        assert ws_event_2.get("event") == "listing_status_changed"
        assert ws_event_2["data"]["id"] == listing_id
        assert ws_event_2["data"]["status"] == "ready"
        assert ws_event_2["data"]["ready_at"] is not None

        # 4. Buyer Charlie reserves a portion
        buyer_headers = {"X-User-Id": "buyer-charlie"}
        reserve_res = client.post(
            f"/food/listings/{listing_id}/reserve",
            json={"quantity": 1, "buyer_phone": "+91-98765-43210"},
            headers=buyer_headers
        )
        assert reserve_res.status_code == 200
        reservation = reserve_res.json()
        assert reservation["status"] == "confirmed"
        # Exact residential address is now unlocked for Buyer Charlie!
        assert reservation["listing"]["is_exact_location"] is True
        assert "Flat 2A, 10 Indiranagar Main Road" in reservation["listing"]["pickup_address"]

        # Buyer Charlie receives real-time listing_reserved event!
        ws_event_3 = ws.receive_json()
        assert ws_event_3.get("event") == "listing_reserved"
        assert ws_event_3["data"]["id"] == listing_id
        assert ws_event_3["data"]["quantity_available"] == 3

        # 5. Seller Alice marks remaining as SOLD OUT
        sold_res = client.patch(
            f"/food/listings/{listing_id}/status",
            json={"status": "sold_out"},
            headers=seller_headers
        )
        assert sold_res.status_code == 200

        # Buyer Charlie receives real-time status update to sold_out!
        ws_event_4 = ws.receive_json()
        assert ws_event_4.get("event") == "listing_status_changed"
        assert ws_event_4["data"]["id"] == listing_id
        assert ws_event_4["data"]["status"] == "sold_out"
