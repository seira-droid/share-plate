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
    # Distance calculation verification
    dist = haversine_distance_km(12.9784, 77.6408, 12.9352, 77.6245)
    assert 4.0 < dist < 6.5
    assert haversine_distance_km(12.9784, 77.6408, 12.9784, 77.6408) == 0.0

def test_coordinate_obfuscation():
    exact_lat = 12.9784
    exact_lon = 77.6408
    approx_lat, approx_lon = obfuscate_coordinates(exact_lat, exact_lon, "listing-test-1")
    assert (approx_lat != exact_lat) or (approx_lon != exact_lon)
    dist = haversine_distance_km(exact_lat, exact_lon, approx_lat, approx_lon)
    assert 0.08 <= dist <= 0.30

def test_radius_and_category_filtering():
    seller_headers = {"X-User-Id": "seller-alice"}
    
    # 1. Near listing (0.5 km away)
    client.post("/food/listings", json={
        "food_name": "Hot Vegetable Samosas (Plate of 4)",
        "description": "Crispy pastry stuffed with spiced potatoes and peas",
        "category": "Evening Snacks & Chaat",
        "house_label": "House #14B (Amma's Kitchen)",
        "portion_size": "4 Large Samosas + Chutney",
        "items_included": "4 Samosas, Mint Chutney, Tamarind Dip",
        "spice_level": "Spicy",
        "meal_time": "Evening Snacks",
        "quantity_available": 10,
        "price": 80.0,
        "currency": "₹",
        "status": "ready",
        "latitude": 12.9784,
        "longitude": 77.6408,
        "pickup_address": "12 City Hall Park, Indiranagar",
        "approx_location_name": "Indiranagar 1st Stage"
    }, headers=seller_headers)

    # 2. Far listing (18 km away)
    client.post("/food/listings", json={
        "food_name": "Far Away Apple Halwa",
        "description": "Rich ghee halwa",
        "category": "Sweets & Desserts",
        "house_label": "House #88 (Far Corner)",
        "portion_size": "250g Box",
        "quantity_available": 2,
        "price": 120.0,
        "currency": "₹",
        "status": "ready",
        "latitude": 13.1500,
        "longitude": 77.7500,
        "pickup_address": "88 Far Hills Road",
        "approx_location_name": "Airport Zone"
    }, headers=seller_headers)

    # Query with radius = 3 km from (12.9784, 77.6408)
    res_3km = client.get("/food/nearby?lat=12.9784&lng=77.6408&radius_km=3.0")
    assert res_3km.status_code == 200
    items_3km = res_3km.json()
    names_3km = [item["food_name"] for item in items_3km]
    assert "Hot Vegetable Samosas (Plate of 4)" in names_3km
    assert "Far Away Apple Halwa" not in names_3km

    # Filter by category
    res_category = client.get("/food/nearby?lat=12.9784&lng=77.6408&radius_km=5.0&category=Evening Snacks & Chaat")
    assert res_category.status_code == 200
    for item in res_category.json():
        assert item["category"] == "Evening Snacks & Chaat"

def test_unauthorized_status_update_denied():
    seller_alice = {"X-User-Id": "seller-alice"}
    buyer_charlie = {"X-User-Id": "buyer-charlie"}

    create_res = client.post("/food/listings", json={
        "food_name": "Amma's Special Malabar Biryani",
        "description": "Family secret recipe",
        "category": "Biryani & Rice",
        "house_label": "House #14B (Amma's Kitchen)",
        "portion_size": "1 Clay Pot",
        "quantity_available": 1,
        "price": 190.0,
        "status": "preparing",
        "latitude": 12.9784,
        "longitude": 77.6408,
        "pickup_address": "77 Grand Street",
        "approx_location_name": "Indiranagar"
    }, headers=seller_alice)
    listing_id = create_res.json()["id"]

    hack_res = client.patch(
        f"/food/listings/{listing_id}/status",
        json={"status": "ready"},
        headers=buyer_charlie
    )
    assert hack_res.status_code == 403

def test_out_of_stock_and_double_reservation_prevention():
    seller_alice = {"X-User-Id": "seller-alice"}
    buyer_charlie = {"X-User-Id": "buyer-charlie"}
    buyer_sneha = {"X-User-Id": "buyer-sneha"}

    create_res = client.post("/food/listings", json={
        "food_name": "Sole Remaining Payasam Bowl",
        "description": "Sweet milk palada",
        "category": "Sweets & Desserts",
        "house_label": "House #7A",
        "portion_size": "300ml Cup",
        "quantity_available": 1,
        "price": 80.0,
        "status": "ready",
        "latitude": 12.9784,
        "longitude": 77.6408,
        "pickup_address": "90 Spring Street",
        "approx_location_name": "Indiranagar North"
    }, headers=seller_alice)
    listing_id = create_res.json()["id"]

    res1 = client.post(
        f"/food/listings/{listing_id}/reserve",
        json={"quantity": 1},
        headers=buyer_charlie
    )
    assert res1.status_code == 200

    res2 = client.post(
        f"/food/listings/{listing_id}/reserve",
        json={"quantity": 1},
        headers=buyer_sneha
    )
    assert res2.status_code == 400
    assert "not available" in res2.json()["detail"].lower() or "remaining" in res2.json()["detail"].lower()

def test_full_seller_buyer_lifecycle():
    seller_headers = {"X-User-Id": "seller-alice"}
    listing_payload = {
        "food_name": "Kerala Layered Porotta with Chicken Roast",
        "description": "Flaky parottas with spicy shallot gravy",
        "category": "Kerala Homestyle",
        "house_label": "House #404 (Biju's Table)",
        "portion_size": "3 Flaky Porottas + 250ml Curry",
        "items_included": "3 Porottas, Chicken Roast, Onion Salad",
        "spice_level": "Spicy",
        "meal_time": "Dinner",
        "quantity_available": 3,
        "price": 160.0,
        "currency": "₹",
        "status": "preparing",
        "latitude": 12.9784,
        "longitude": 77.6408,
        "pickup_address": "Flat 404, Maple Heights, Indiranagar",
        "approx_location_name": "Indiranagar Enclave",
        "pickup_instructions": "Take lift to 4th floor.",
        "dietary_tags": "Non-Veg, Coconut Oil"
    }

    create_res = client.post("/food/listings", json=listing_payload, headers=seller_headers)
    assert create_res.status_code == 201
    created_data = create_res.json()
    listing_id = created_data["id"]
    assert created_data["status"] == "preparing"
    assert created_data["house_label"] == "House #404 (Biju's Table)"
    assert created_data["portion_size"] == "3 Flaky Porottas + 250ml Curry"
    assert created_data["is_exact_location"] is True
    assert created_data["pickup_address"] == "Flat 404, Maple Heights, Indiranagar"

    buyer_headers = {"X-User-Id": "buyer-charlie"}
    nearby_res = client.get("/food/nearby?lat=12.9785&lng=77.6409&radius_km=2.0", headers=buyer_headers)
    assert nearby_res.status_code == 200
    nearby_items = nearby_res.json()
    matching = [item for item in nearby_items if item["id"] == listing_id]
    assert len(matching) == 1
    buyer_view = matching[0]
    assert buyer_view["is_exact_location"] is False
    assert "Flat 404" not in buyer_view.get("pickup_address", "")
    assert buyer_view["portion_size"] == "3 Flaky Porottas + 250ml Curry"

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
        json={"quantity": 1, "buyer_phone": "+91-98765-11111"},
        headers=buyer_headers
    )
    assert reserve_res.status_code == 200
    reservation_data = reserve_res.json()
    assert reservation_data["status"] == "confirmed"
    
    reserved_listing = reservation_data["listing"]
    assert reserved_listing["is_exact_location"] is True
    assert "Flat 404, Maple Heights" in reserved_listing["pickup_address"]

    detail_res = client.get(f"/food/listings/{listing_id}", headers=buyer_headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["quantity_available"] == 2
    assert detail_res.json()["reserved_by_current_user"] is True

    cancel_res = client.post(f"/food/listings/{listing_id}/cancel", headers=buyer_headers)
    assert cancel_res.status_code == 200
    cancelled_detail = cancel_res.json()
    assert cancelled_detail["quantity_available"] == 3
    assert cancelled_detail["status"] == "ready"
