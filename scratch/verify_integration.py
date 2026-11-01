import sys, os
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from backend.main import app
from fastapi.testclient import TestClient
import json

client = TestClient(app)

# 1. Test Static Frontend
r_home = client.get("/")
print("GET / Status:", r_home.status_code, "HTML Length:", len(r_home.content))
assert r_home.status_code == 200
assert b"<div id=\"root\">" in r_home.content or b"<!DOCTYPE html>" in r_home.content or b"<html" in r_home.content

# 2. Test Food Discovery & Kerala Menu
r_food = client.get("/food/nearby?lat=9.9625&lng=76.2990&radius_km=10")
print("GET /food/nearby Status:", r_food.status_code)
assert r_food.status_code == 200
food_items = r_food.json()
print(f"Total seeded dishes retrieved: {len(food_items)}")
for item in food_items[:5]:
    print(f"  • {item['food_name']} (₹{item['price']}) by {item['seller_name']} [{item.get('house_label', 'House')}] - Portion: {item.get('portion_size')}")

# 3. Test RBAC protection
r_admin_unauth = client.get("/admin/overview")
print("Unauthenticated GET /admin/overview Status:", r_admin_unauth.status_code)
assert r_admin_unauth.status_code == 401

# 4. Test Admin Login and Admin Overview
r_admin_login = client.post("/auth/admin-login", json={"email": "admin@foodnearby.in", "password": "Admin@FoodNearby2026"})
print("Admin Login Status:", r_admin_login.status_code)
assert r_admin_login.status_code == 200
admin_token = r_admin_login.json()["access_token"]

r_admin_auth = client.get("/admin/overview", headers={"Authorization": f"Bearer {admin_token}"})
print("Authenticated Admin GET /admin/overview Status:", r_admin_auth.status_code)
assert r_admin_auth.status_code == 200
overview = r_admin_auth.json()
print("Admin Overview Stats:", json.dumps(overview, indent=2))

print("\n>>> ALL INTEGRATION VERIFICATIONS SUCCESSFUL! <<<")
