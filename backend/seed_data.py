from datetime import datetime, timedelta
import math
import uuid
from sqlalchemy.orm import Session
from .models import FoodListing, ListingStatus, User
from .geospatial import obfuscate_coordinates

# Authentic Kerala sample dishes explicitly requested in specification:
KERALA_SPEC_FOODS = [
    {
        "seller_id": "seller-lakshmi",
        "seller_name": "Lakshmi Menon",
        "food_name": "Kerala Vegetable Meals",
        "category": "Kerala Homestyle",
        "description": "Authentic Kerala homestyle vegetarian meals served with red Matta rice, aromatic Sambar, fresh Aviyal, cabbage Thoran, Moru curry, crispy Pappadam, and pickle.",
        "house_label": "House #12B (Lakshmi's Traditional Kitchen)",
        "portion_size": "1 Complete Banana Leaf Meal Box",
        "items_included": "Kerala Matta rice, Sambar, Aviyal, Thoran, Pulissery, Pappadam & Inji Puli",
        "meal_time": "Lunch",
        "spice_level": "Mild",
        "price": 30.0,
        "quantity": 8,
        "status": ListingStatus.READY.value,
        "offset_dx": 180,
        "offset_dy": 120,
        "address": "12B, Panampilly Nagar Main Road, Kochi",
        "neighborhood": "Panampilly Nagar Central",
        "instructions": "Side door entrance. Insulated eco-friendly packaging. Ready hot for pickup.",
        "dietary": "100% Pure Veg, Organic Ghee",
        "image": "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80"
    },
    {
        "seller_id": "seller-suresh",
        "seller_name": "Suresh Babu",
        "food_name": "Homemade Chicken Curry",
        "category": "Kerala Homestyle",
        "description": "Slow-cooked rustic Kerala chicken curry prepared with freshly ground shallots, curry leaves, crushed black pepper, and roasted coriander in cold-pressed coconut oil.",
        "house_label": "Flat 304 (Suresh's Spice Kitchen)",
        "portion_size": "350ml Bowl (Feeds 1-2)",
        "items_included": "Tender chicken pieces simmered in thick roasted coconut gravy with shallots & curry leaves",
        "meal_time": "Dinner",
        "spice_level": "Spicy",
        "price": 50.0,
        "quantity": 6,
        "status": ListingStatus.READY.value,
        "offset_dx": -250,
        "offset_dy": 200,
        "address": "Flat 304, Palm Grove Apartments, Ravipuram, Kochi",
        "neighborhood": "Ravipuram Enclave",
        "instructions": "Take elevator to 3rd floor. Please bring a container or take insulated tub.",
        "dietary": "Halal, Non-Veg",
        "image": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80"
    },
    {
        "seller_id": "seller-divya",
        "seller_name": "Divya Nair",
        "food_name": "Appam and Vegetable Stew",
        "category": "South Indian Tiffin",
        "description": "Lacy, soft-centered fermented rice appams paired with aromatic mild vegetable stew simmered with carrots, potatoes, and green peas in thick fresh coconut milk.",
        "house_label": "House #7A (Divya's Appam Corner)",
        "portion_size": "4 Fresh Appams + 300ml Stew",
        "items_included": "4 soft fermented appams with mild spiced creamy coconut milk vegetable stew",
        "meal_time": "Breakfast",
        "spice_level": "Mild",
        "price": 40.0,
        "quantity": 5,
        "status": ListingStatus.READY.value,
        "offset_dx": 380,
        "offset_dy": -220,
        "address": "7A, Girinagar Colony, Kadavanthra, Kochi",
        "neighborhood": "Girinagar Green View",
        "instructions": "Ground floor verandah. Still steaming hot off the appachatti.",
        "dietary": "100% Pure Veg, Gluten-Free",
        "image": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80"
    },
    {
        "seller_id": "seller-kavitha",
        "seller_name": "Kavitha Raj",
        "food_name": "Homemade Idiyappam",
        "category": "South Indian Tiffin",
        "description": "Steamed delicate string hoppers (Idiyappam) made with roasted rice flour, topped with freshly grated coconut. Served with sweetened coconut milk or spicy vegetable kurma.",
        "house_label": "Villa 18 (Kavitha's Tiffin Hut)",
        "portion_size": "5 Large Idiyappams + Coconut Milk & Kurma",
        "items_included": "5 soft string hoppers, cardamom coconut milk dip & mixed vegetable kurma",
        "meal_time": "Dinner",
        "spice_level": "Mild",
        "price": 25.0,
        "quantity": 6,
        "status": ListingStatus.PREPARING.value,
        "offset_dx": -400,
        "offset_dy": -180,
        "address": "Villa 18, Marine Drive Skywalk, Kochi",
        "neighborhood": "Marine Drive Promenade",
        "instructions": "In steamer now, ready in 15 minutes. Gate bell on left.",
        "dietary": "100% Pure Veg, Vegan",
        "image": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80"
    },
    {
        "seller_id": "seller-anil",
        "seller_name": "Anil Kumar",
        "food_name": "Lemon Rice",
        "category": "Biryani & Rice",
        "description": "Zesty, fragrant tempered rice seasoned with mustard seeds, curry leaves, roasted peanuts, ginger, and freshly squeezed lemon juice. Accompanied by crispy appalam and pickle.",
        "house_label": "House #44 (Anil's South Indian Hearth)",
        "portion_size": "1 Large Meal Bowl (400g)",
        "items_included": "Lemon rice with crunchy peanuts, roasted papad, and spicy mango pickle",
        "meal_time": "Lunch",
        "spice_level": "Medium",
        "price": 20.0,
        "quantity": 4,
        "status": ListingStatus.READY.value,
        "offset_dx": 100,
        "offset_dy": 350,
        "address": "44, South Railway Station Road, Kochi",
        "neighborhood": "Ernakulam South",
        "instructions": "Pickup at front window counter. Freshly tempered.",
        "dietary": "100% Pure Veg, Gluten-Free",
        "image": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80"
    }
]

def seed_sample_listings(db: Session, center_lat: float, center_lon: float):
    """Seed sample Kerala food listings around given center GPS coordinates."""
    for item in KERALA_SPEC_FOODS:
        d_lat = item["offset_dy"] / 111320.0
        d_lon = item["offset_dx"] / (111320.0 * math.cos(math.radians(center_lat)))
        
        exact_lat = round(center_lat + d_lat, 6)
        exact_lon = round(center_lon + d_lon, 6)
        
        listing_id = str(uuid.uuid4())
        approx_lat, approx_lon = obfuscate_coordinates(exact_lat, exact_lon, listing_id)

        ready_time = datetime.utcnow() - timedelta(minutes=(abs(item["offset_dx"]) % 30) + 5) if item["status"] == ListingStatus.READY.value else None

        listing = FoodListing(
            id=listing_id,
            seller_id=item["seller_id"],
            seller_name=item["seller_name"],
            food_name=item["food_name"],
            description=item["description"],
            category=item["category"],
            house_label=item["house_label"],
            portion_size=item["portion_size"],
            items_included=item["items_included"],
            meal_time=item["meal_time"],
            spice_level=item["spice_level"],
            quantity=item["quantity"],
            quantity_available=item["quantity"],
            price=item["price"],
            currency="₹",
            image_url=item["image"],
            availability_status=item["status"],
            exact_latitude=exact_lat,
            exact_longitude=exact_lon,
            approx_latitude=approx_lat,
            approx_longitude=approx_lon,
            pickup_address=item["address"],
            approx_location_name=item["neighborhood"],
            pickup_instructions=item["instructions"],
            dietary_tags=item["dietary"],
            ready_at=ready_time,
            created_at=datetime.utcnow() - timedelta(hours=1)
        )
        db.add(listing)

    db.commit()
