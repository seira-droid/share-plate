import uuid
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import Base, engine, SessionLocal
from backend.routes.auth import init_demo_identities, SAMPLE_ADMIN

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    init_demo_identities(db)
    yield db
    db.close()

def test_separate_buyer_and_seller_registration():
    rand_suffix = uuid.uuid4().hex[:6]
    # 1. Buyer Registration
    buyer_res = client.post("/auth/register/buyer", json={
        "full_name": "Test Ananya",
        "email": f"test.ananya.{rand_suffix}@foodnearby.in",
        "phone": "+91-98460-99991",
        "password": "Password123"
    })
    assert buyer_res.status_code == 201
    buyer_data = buyer_res.json()
    assert buyer_data["user"]["role"] == "BUYER"
    assert "access_token" in buyer_data

    # 2. Seller Registration
    seller_res = client.post("/auth/register/seller", json={
        "full_name": "Test Lakshmi",
        "email": f"test.lakshmi.{rand_suffix}@foodnearby.in",
        "phone": "+91-98470-99992",
        "password": "Password123",
        "kitchen_name": "Lakshmi's Test Kitchen",
        "pickup_location": "Panampilly Nagar, Kochi",
        "latitude": 9.9625,
        "longitude": 76.2990
    })
    assert seller_res.status_code == 201
    seller_data = seller_res.json()
    assert seller_data["user"]["role"] == "SELLER"
    assert seller_data["user"]["kitchen_name"] == "Lakshmi's Test Kitchen"

def test_admin_login_and_rbac_restrictions():
    # 1. Admin login with correct credentials
    admin_login_res = client.post("/auth/admin-login", json={
        "email": SAMPLE_ADMIN["email"],
        "password": SAMPLE_ADMIN["password"]
    })
    assert admin_login_res.status_code == 200
    admin_token = admin_login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin accesses overview
    overview_res = client.get("/admin/overview", headers=admin_headers)
    assert overview_res.status_code == 200
    assert overview_res.json()["total_users"] >= 5

    # 2. Buyer attempts to access admin endpoint -> 403 Forbidden!
    buyer_login_res = client.post("/auth/demo-login/buyer-ananya")
    assert buyer_login_res.status_code == 200
    buyer_token = buyer_login_res.json()["access_token"]
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}

    buyer_admin_attempt = client.get("/admin/overview", headers=buyer_headers)
    assert buyer_admin_attempt.status_code == 403
    assert "Forbidden" in buyer_admin_attempt.json()["detail"]

    # 3. Seller attempts to access admin endpoint -> 403 Forbidden!
    seller_login_res = client.post("/auth/demo-login/seller-lakshmi")
    assert seller_login_res.status_code == 200
    seller_token = seller_login_res.json()["access_token"]
    seller_headers = {"Authorization": f"Bearer {seller_token}"}

    seller_admin_attempt = client.get("/admin/overview", headers=seller_headers)
    assert seller_admin_attempt.status_code == 403

    # 4. Unauthenticated request to admin -> 401 Unauthorized!
    unauth_attempt = client.get("/admin/overview")
    assert unauth_attempt.status_code == 401

def test_buyer_forbidden_from_creating_listing():
    # Buyer attempts to create food listing -> 403 Forbidden!
    buyer_login_res = client.post("/auth/demo-login/buyer-arjun")
    buyer_headers = {"Authorization": f"Bearer {buyer_login_res.json()['access_token']}"}

    illegal_listing = client.post("/food/listings", json={
        "food_name": "Unauthorized Biryani",
        "category": "Biryani & Rice",
        "price": 100.0,
        "quantity": 2,
        "latitude": 9.9625,
        "longitude": 76.2990,
        "pickup_address": "Secret Road"
    }, headers=buyer_headers)
    assert illegal_listing.status_code == 403
    assert "Only registered household sellers" in illegal_listing.json()["detail"]

def test_seller_lifecycle_and_buyer_reservation():
    # 1. Seller Lakshmi logs in and creates Kerala Vegetable Meals at ₹30
    seller_login = client.post("/auth/demo-login/seller-lakshmi")
    seller_headers = {"Authorization": f"Bearer {seller_login.json()['access_token']}"}

    listing_res = client.post("/food/listings", json={
        "food_name": "Kerala Vegetable Meals",
        "description": "Red Matta rice with sambar, aviyal, thoran & payasam",
        "category": "Kerala Homestyle",
        "house_label": "House #12B (Lakshmi's Traditional Kitchen)",
        "portion_size": "1 Complete Banana Leaf Meal Box",
        "items_included": "Matta rice, Sambar, Aviyal, Thoran, Pappadam, Payasam",
        "spice_level": "Mild",
        "meal_time": "Lunch",
        "quantity": 5,
        "price": 30.0,
        "status": "preparing",
        "latitude": 9.9625,
        "longitude": 76.2990,
        "pickup_address": "12B, Panampilly Nagar Main Road, Kochi",
        "approx_location_name": "Panampilly Nagar Central",
        "pickup_instructions": "Side door entrance. Ready hot for pickup."
    }, headers=seller_headers)
    assert listing_res.status_code == 201
    listing = listing_res.json()
    listing_id = listing["id"]
    assert listing["price"] == 30.0
    assert listing["status"] == "preparing"

    # 2. Seller marks FOOD IS READY
    ready_res = client.patch(f"/food/listings/{listing_id}/status", json={"status": "ready"}, headers=seller_headers)
    assert ready_res.status_code == 200
    assert ready_res.json()["status"] == "ready"
    assert ready_res.json()["ready_at"] is not None

    # 3. Buyer Ananya discovers nearby food within 3km of Panampilly Nagar (9.9625, 76.2990)
    buyer_login = client.post("/auth/demo-login/buyer-ananya")
    buyer_headers = {"Authorization": f"Bearer {buyer_login.json()['access_token']}"}

    nearby_res = client.get("/food/nearby?lat=9.9625&lng=76.2990&radius_km=3.0", headers=buyer_headers)
    assert nearby_res.status_code == 200
    items = nearby_res.json()
    found = [i for i in items if i["id"] == listing_id]
    assert len(found) == 1
    # Privacy check: exact house number must NOT be in public view
    assert found[0]["is_exact_location"] is False
    assert "12B, Panampilly Nagar Main Road" not in found[0].get("pickup_address", "")

    # 4. Buyer reserves 2 portions
    reserve_res = client.post(
        f"/food/listings/{listing_id}/reserve",
        json={"quantity": 2, "buyer_phone": "+91-98460-11223"},
        headers=buyer_headers
    )
    assert reserve_res.status_code == 200
    res_data = reserve_res.json()
    assert res_data["quantity"] == 2
    assert res_data["status"] == "confirmed"
    # Exact residential address is unlocked!
    assert res_data["listing"]["is_exact_location"] is True
    assert "12B, Panampilly Nagar Main Road" in res_data["listing"]["pickup_address"]

def test_admin_seller_moderation_and_listing_removal():
    admin_login = client.post("/auth/admin-login", json={
        "email": SAMPLE_ADMIN["email"],
        "password": SAMPLE_ADMIN["password"]
    })
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    # 1. Admin suspends seller Suresh
    suspend_res = client.patch(
        "/admin/sellers/seller-suresh/verify",
        json={"verification_status": "suspended", "account_status": "suspended"},
        headers=admin_headers
    )
    assert suspend_res.status_code == 200
    assert suspend_res.json()["account_status"] == "suspended"

    # Suspended seller Suresh tries to log in -> 403 Forbidden!
    suresh_attempt = client.post("/auth/login", json={
        "email": "suresh.babu@foodnearby.in",
        "password": "Demo@Password123"
    })
    assert suresh_attempt.status_code == 403
    assert "suspended" in suresh_attempt.json()["detail"].lower()

    # 2. Reactivate seller Suresh
    reactivate_res = client.patch(
        "/admin/sellers/seller-suresh/verify",
        json={"verification_status": "approved", "account_status": "active"},
        headers=admin_headers
    )
    assert reactivate_res.status_code == 200
    assert reactivate_res.json()["account_status"] == "active"
