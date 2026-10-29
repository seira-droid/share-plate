from datetime import datetime, timedelta
import math
import uuid
from sqlalchemy.orm import Session
from .models import FoodListing, User, ListingStatus
from .geospatial import obfuscate_coordinates

PRESET_FOODS = [
    {
        "food_name": "Nonna's Homemade Lasagna Bolognese",
        "category": "Home Meals",
        "description": "Slow-simmered beef & pork ragù layered with fresh egg pasta, creamy béchamel, and 24-month aged Parmigiano Reggiano. Packed hot in eco containers.",
        "price": 8.50,
        "quantity": 4,
        "status": ListingStatus.READY.value,
        "offset_dx": 350,   # meters east
        "offset_dy": 200,   # meters north
        "address": "42 Maple Avenue, House #2B",
        "neighborhood": "Maple Ridge Community",
        "instructions": "Side door entrance. Ring bell #2. Container is insulated.",
        "dietary": "Halal Beef, Contains Dairy",
        "image": "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=600&q=80",
        "seller_id": "seller-alice",
        "seller_name": "Alice Montgomery"
    },
    {
        "food_name": "Artisan Sourdough Batard (Fresh Baked)",
        "category": "Bakery & Breads",
        "description": "Wild fermented 36-hour slow fermented sourdough with blistered crunchy crust and open, custardy crumb. Baked 45 minutes ago in Dutch oven.",
        "price": 6.00,
        "quantity": 3,
        "status": ListingStatus.READY.value,
        "offset_dx": -450,
        "offset_dy": 300,
        "address": "118 Pinecrest Road, Unit 1A",
        "neighborhood": "Pinecrest Gardens",
        "instructions": "Leave payment or confirm in app. Loaf is on the porch pickup table.",
        "dietary": "Vegan, Organic Wheat",
        "image": "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=600&q=80",
        "seller_id": "seller-bob",
        "seller_name": "Bob Rodriguez"
    },
    {
        "food_name": "Aromatic Chicken Dum Biryani",
        "category": "Curries & Rice",
        "description": "Fragrant long-grain aged basmati rice layered with spiced marinated chicken thighs, saffron milk, fried onions, and fresh mint. Served with cooling cucumber raita.",
        "price": 9.00,
        "quantity": 5,
        "status": ListingStatus.READY.value,
        "offset_dx": 600,
        "offset_dy": -500,
        "address": "77 Cedar Lane, Ground Floor",
        "neighborhood": "Cedar Valley Green",
        "instructions": "Front porch bell. Extra raita upon request.",
        "dietary": "Gluten-Free, Halal",
        "image": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
        "seller_id": "seller-alice",
        "seller_name": "Alice Montgomery"
    },
    {
        "food_name": "Warm Chocolate Sea Salt Cookies (Box of 4)",
        "category": "Desserts & Snacks",
        "description": "Crispy edges, gooey center with 70% dark Belgian chocolate chunks and Maldon sea salt flakes. Straight out of the oven!",
        "price": 5.50,
        "quantity": 6,
        "status": ListingStatus.READY.value,
        "offset_dx": -250,
        "offset_dy": -400,
        "address": "205 Oakwood Boulevard",
        "neighborhood": "Oakwood East",
        "instructions": "Ring top doorbell. Still warm in kraft box.",
        "dietary": "Vegetarian",
        "image": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80",
        "seller_id": "seller-bob",
        "seller_name": "Bob Rodriguez"
    },
    {
        "food_name": "Rainbow Quinoa & Roasted Veggie Bowl",
        "category": "Healthy & Salads",
        "description": "Fluffy tricolor quinoa, roasted butternut squash, avocado, spiced chickpeas, baby spinach, and creamy lemon tahini dressing.",
        "price": 7.50,
        "quantity": 2,
        "status": ListingStatus.PREPARING.value,
        "offset_dx": 850,
        "offset_dy": 150,
        "address": "15 Willow Creek Way",
        "neighborhood": "Willow Creek Commons",
        "instructions": "Ready in ~15 mins. Pickup at back patio.",
        "dietary": "100% Vegan, Gluten-Free",
        "image": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
        "seller_id": "seller-alice",
        "seller_name": "Alice Montgomery"
    },
    {
        "food_name": "Authentic Thai Green Coconut Curry",
        "category": "Curries & Rice",
        "description": "Fragrant kaffir lime, lemongrass, bamboo shoots, Thai basil, and tender chicken simmered in rich coconut milk. Served with steamed jasmine rice.",
        "price": 9.50,
        "quantity": 4,
        "status": ListingStatus.READY.value,
        "offset_dx": -700,
        "offset_dy": -200,
        "address": "88 Elm Street, Apt 3",
        "neighborhood": "Elmwood Park",
        "instructions": "Second floor door #3. Container included.",
        "dietary": "Dairy-Free, Spicy",
        "image": "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=600&q=80",
        "seller_id": "seller-bob",
        "seller_name": "Bob Rodriguez"
    }
]

def seed_sample_listings(db: Session, center_lat: float, center_lon: float):
    """
    Seeds realistic sample food listings placed around a given center GPS coordinate.
    """
    # Delete previous seeded listings if needed or keep existing
    for item in PRESET_FOODS:
        # Calculate offset in degrees: 111320 meters per degree lat
        d_lat = item["offset_dy"] / 111320.0
        d_lon = item["offset_dx"] / (111320.0 * math.cos(math.radians(center_lat)))
        
        exact_lat = round(center_lat + d_lat, 6)
        exact_lon = round(center_lon + d_lon, 6)
        
        listing_id = str(uuid.uuid4())
        approx_lat, approx_lon = obfuscate_coordinates(exact_lat, exact_lon, listing_id)

        ready_time = datetime.utcnow() - timedelta(minutes=(abs(item["offset_dx"]) % 40) + 5) if item["status"] == ListingStatus.READY.value else None

        listing = FoodListing(
            id=listing_id,
            seller_id=item["seller_id"],
            seller_name=item["seller_name"],
            food_name=item["food_name"],
            description=item["description"],
            category=item["category"],
            quantity_available=item["quantity"],
            price=item["price"],
            currency="$",
            food_image=item["image"],
            status=item["status"],
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
