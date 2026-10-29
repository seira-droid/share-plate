import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import Base, engine, SessionLocal
from backend.models import FoodListing, ListingStatus, User
from backend.routes.auth import init_demo_users
from backend.geospatial import haversine_distance_km, obfuscate_coordinates

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    init_demo_users(db)
    yield db
    db.close()

def test_haversine_distance():
    # Empire State Building to Times Square is ~1.07 km
    dist = haversine_distance_km(40.7484, -73.9857, 40.7580, -73.9855)
    assert 0.9 < dist < 1.3
    assert haversine_distance_km(40.7484, -73.9857, 40.7484, -73.9857) == 0.0

def test_coordinate_obfuscation():
    exact_lat = 40.7484
    exact_lon = -73.9857
    approx_lat, approx_lon = obfuscate_coordinates(exact_lat, exact_lon, "listing-test-1")
    assert (approx_lat != exact_lat) or (approx_lon != exact_lon)
    dist = haversine_distance_km(exact_lat, exact_lon, approx_lat, approx_lon)
    assert 0.08 <= dist <= 0.30

def test_radius_and_category_filtering():
    seller_headers = {"X-User-Id": "seller-alice"}
    
    # 1. Near listing (0.5 km away)
    client.post("/food/listings", json={
        "food_name": "Hot Vegetable Samosas",
        "description": "Crispy pastry stuffed with spiced potatoes and peas",
        "category": "Desserts & Snacks",
        "quantity_available": 10,
        "price": 3.0,
        "status": "ready",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "pickup_address": "12 City Hall Park",
        "approx_location_name": "Civic Center"
    }, headers=seller_headers)

    # 2. Far listing (18 km away in Queens/Brooklyn boundary)
    client.post("/food/listings", json={
        "food_name": "Far Away Apple Pie",
        "description": "Freshly baked apple pie",
        "category": "Bakery & Breads",
        "quantity_available": 2,
        "price": 12.0,
        "status": "ready",
        "latitude": 40.8500,
        "longitude": -73.8500,
        "pickup_address": "88 Far Hills Road",
        "approx_location_name": "Far Hills"
    }, headers=seller_headers)

    # Query with radius = 3 km from (40.7128, -74.0060)
    res_3km = client.get("/food/nearby?lat=40.7128&lng=-74.0060&radius_km=3.0")
    assert res_3km.status_code == 200
    items_3km = res_3km.json()
    names_3km = [item["food_name"] for item in items_3km]
    assert "Hot Vegetable Samosas" in names_3km
    assert "Far Away Apple Pie" not in names_3km

    # Filter by category
    res_category = client.get("/food/nearby?lat=40.7128&lng=-74.0060&radius_km=5.0&category=Desserts & Snacks")
    assert res_category.status_code == 200
    for item in res_category.json():
        assert item["category"] == "Desserts & Snacks"

def test_unauthorized_status_update_denied():
    seller_alice = {"X-User-Id": "seller-alice"}
    buyer_charlie = {"X-User-Id": "buyer-charlie"}

    # Alice creates listing
    create_res = client.post("/food/listings", json={
        "food_name": "Alice's Famous Lasagna",
        "description": "Family recipe",
        "category": "Home Meals",
        "quantity_available": 1,
        "price": 10.0,
        "status": "preparing",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "pickup_address": "77 Grand Street",
        "approx_location_name": "SoHo"
    }, headers=seller_alice)
    listing_id = create_res.json()["id"]

    # Charlie (buyer) tries to change Alice's listing status to 'ready' -> should be 403 Forbidden!
    hack_res = client.patch(
        f"/food/listings/{listing_id}/status",
        json={"status": "ready"},
        headers=buyer_charlie
    )
    assert hack_res.status_code == 403

def test_out_of_stock_and_double_reservation_prevention():
    seller_alice = {"X-User-Id": "seller-alice"}
    buyer_charlie = {"X-User-Id": "buyer-charlie"}
    buyer_diana = {"X-User-Id": "buyer-diana"}

    create_res = client.post("/food/listings", json={
        "food_name": "Sole remaining Lemon Tart",
        "description": "Zesty and fresh",
        "category": "Desserts & Snacks",
        "quantity_available": 1,
        "price": 4.5,
        "status": "ready",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "pickup_address": "90 Spring Street",
        "approx_location_name": "SoHo North"
    }, headers=seller_alice)
    listing_id = create_res.json()["id"]

    # Charlie reserves the only portion
    res1 = client.post(
        f"/food/listings/{listing_id}/reserve",
        json={"quantity": 1},
        headers=buyer_charlie
    )
    assert res1.status_code == 200

    # Diana attempts to reserve the same portion -> must fail with 400!
    res2 = client.post(
        f"/food/listings/{listing_id}/reserve",
        json={"quantity": 1},
        headers=buyer_diana
    )
    assert res2.status_code == 400
    assert "not available" in res2.json()["detail"].lower() or "remaining" in res2.json()["detail"].lower()

def test_full_seller_buyer_lifecycle():
    seller_headers = {"X-User-Id": "seller-alice"}
    listing_payload = {
        "food_name": "Warm Homemade Focaccia with Rosemary",
        "description": "Crispy golden olive oil focaccia baked with fresh garden rosemary and sea salt.",
        "category": "Bakery & Breads",
        "quantity_available": 3,
        "price": 5.0,
        "currency": "$",
        "status": "preparing",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "pickup_address": "Apartment 4B, 25 Broadway, New York",
        "approx_location_name": "Lower Manhattan / Battery Park",
        "pickup_instructions": "Buzzer 4B. Please bring a cloth bag.",
        "dietary_tags": "Vegan, Nut-Free"
    }

    create_res = client.post("/food/listings", json=listing_payload, headers=seller_headers)
    assert create_res.status_code == 201
    created_data = create_res.json()
    listing_id = created_data["id"]
    assert created_data["status"] == "preparing"
    assert created_data["is_exact_location"] is True  # Seller sees exact
    assert created_data["pickup_address"] == "Apartment 4B, 25 Broadway, New York"

    buyer_headers = {"X-User-Id": "buyer-charlie"}
    nearby_res = client.get("/food/nearby?lat=40.7130&lng=-74.0062&radius_km=2.0", headers=buyer_headers)
    assert nearby_res.status_code == 200
    nearby_items = nearby_res.json()
    matching = [item for item in nearby_items if item["id"] == listing_id]
    assert len(matching) == 1
    buyer_view = matching[0]
    assert buyer_view["is_exact_location"] is False
    assert "Apartment 4B" not in buyer_view.get("pickup_address", "")
    assert buyer_view["distance_km"] is not None

    status_update_res = client.patch(
        f"/food/listings/{listing_id}/status",
        json={"status": "ready"},
        headers=seller_headers
    )
    assert status_update_res.status_code == 200
    updated = status_update_res.json()
    assert updated["status"] == "ready"
    assert updated["ready_at"] is not None

    reserve_res = client.post(
        f"/food/listings/{listing_id}/reserve",
        json={"quantity": 1, "buyer_phone": "+1-555-8888"},
        headers=buyer_headers
    )
    assert reserve_res.status_code == 200
    reservation_data = reserve_res.json()
    assert reservation_data["status"] == "confirmed"
    
    reserved_listing = reservation_data["listing"]
    assert reserved_listing["is_exact_location"] is True
    assert "Apartment 4B, 25 Broadway" in reserved_listing["pickup_address"]
    assert "Buzzer 4B" in reserved_listing["pickup_instructions"]

    detail_res = client.get(f"/food/listings/{listing_id}", headers=buyer_headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["quantity_available"] == 2
    assert detail_res.json()["reserved_by_current_user"] is True

    cancel_res = client.post(f"/food/listings/{listing_id}/cancel", headers=buyer_headers)
    assert cancel_res.status_code == 200
    cancelled_detail = cancel_res.json()
    assert cancelled_detail["quantity_available"] == 3
    assert cancelled_detail["status"] == "ready"
