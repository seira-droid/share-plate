from datetime import datetime, timedelta
import math
import uuid
from sqlalchemy.orm import Session
from .models import FoodListing, ListingStatus
from .geospatial import obfuscate_coordinates

INDIAN_PRESET_FOODS = [
    {
        "food_name": "Malabar Chicken Dum Biryani (Kozhikode Style)",
        "category": "Biryani & Rice",
        "description": "Fragrant Kaima rice slow-cooked on dum with marinated chicken thighs, fried onions, cashews, raisins, and special Malabar garam masala. Served hot in biodegradable clay-style boxes.",
        "house_label": "House #12B (Nisha's Malabar Kitchen)",
        "portion_size": "1 Full Meal Box (Feeds 1-2)",
        "items_included": "Kaima Biryani with 2 chicken pieces, boiled egg, date lemon pickle, onion raitha & roasted pappadom",
        "meal_time": "Lunch",
        "spice_level": "Medium",
        "price": 190.0,
        "quantity": 6,
        "status": ListingStatus.READY.value,
        "offset_dx": 300,
        "offset_dy": 180,
        "address": "House #12B, 3rd Cross, Indiranagar 1st Stage",
        "neighborhood": "Indiranagar Central",
        "instructions": "Side gate entrance. Press buzzer 12B. Packed hot in insulated parcel.",
        "dietary": "Halal, Homemade Ghee",
        "image": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
        "seller_id": "seller-priya",
        "seller_name": "Priya Nair"
    },
    {
        "food_name": "Flaky Kerala Porotta with Pepper Chicken Roast",
        "category": "Kerala Homestyle",
        "description": "Hand-rolled flaky multi-layered Malabar porottas paired with slow-roasted chicken cooked with crushed black pepper, shallots, curry leaves, and coconut slivers in cold-pressed coconut oil.",
        "house_label": "House #404 (Biju's Homestead Table)",
        "portion_size": "3 Layered Porottas + 250ml Curry Container",
        "items_included": "3 flaky beaten Kerala porottas, roasted pepper chicken gravy with shallots & onion salad",
        "meal_time": "Dinner",
        "spice_level": "Spicy",
        "price": 160.0,
        "quantity": 5,
        "status": ListingStatus.READY.value,
        "offset_dx": -350,
        "offset_dy": 250,
        "address": "Flat 404, Maple Heights Apartments, 7th Main",
        "neighborhood": "Maple Green Enclave",
        "instructions": "Take lift to 4th floor, Flat 404. Fresh and hot off the tawa.",
        "dietary": "Non-Veg, Coconut Oil Cooked",
        "image": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80",
        "seller_id": "seller-priya",
        "seller_name": "Priya Nair"
    },
    {
        "food_name": "Traditional Kerala Oonu (Sadhya Meal Platter)",
        "category": "Traditional Thali",
        "description": "Authentic homestyle Kerala vegetarian Sadhya feast. Steamed organic red Matta rice with rich lentil Sambar, tangy Pulissery, fresh Aviyal, and crunchy Cabbage Thoran.",
        "house_label": "House #7A (Amma's Heritage Kitchen)",
        "portion_size": "1 Complete Sadhya Meal Box",
        "items_included": "Kerala Matta rice, Sambar, Moru curry, Aviyal, Thoran, Pappadam, Inji Puli & Payasam cup",
        "meal_time": "Lunch",
        "spice_level": "Mild",
        "price": 140.0,
        "quantity": 4,
        "status": ListingStatus.READY.value,
        "offset_dx": 550,
        "offset_dy": -320,
        "address": "House #7A, 5th Cross, Lakeview Road",
        "neighborhood": "Lakeview Residency",
        "instructions": "Front porch bell. Eco-friendly banana leaf packaging.",
        "dietary": "100% Pure Veg, Jain Friendly",
        "image": "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80",
        "seller_id": "seller-rajesh",
        "seller_name": "Chef Rajesh Sharma"
    },
    {
        "food_name": "Paneer Butter Masala with 3 Soft Butter Naan",
        "category": "North Indian Curries",
        "description": "Creamy rich tomato-cashew makhani gravy with tender fresh paneer cubes, infused with kasuri methi and butter. Paired with soft tawa-blistered butter naans.",
        "house_label": "House #31 (Sharma Family Rasoi)",
        "portion_size": "3 Butter Naan + 350ml Paneer Gravy",
        "items_included": "3 fresh butter naans, rich paneer butter masala gravy, vinegar onion rings & fresh mint chutney",
        "meal_time": "Dinner",
        "spice_level": "Medium",
        "price": 180.0,
        "quantity": 4,
        "status": ListingStatus.READY.value,
        "offset_dx": -200,
        "offset_dy": -400,
        "address": "Villa 31, Shanti Niketan Society",
        "neighborhood": "Shanti Niketan Block B",
        "instructions": "Ring calling bell #31. Hot naans wrapped in silver foil.",
        "dietary": "100% Pure Veg",
        "image": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80",
        "seller_id": "seller-rajesh",
        "seller_name": "Chef Rajesh Sharma"
    },
    {
        "food_name": "Crispy Ghee Podi Masala Dosa & Medu Vada Combo",
        "category": "South Indian Tiffin",
        "description": "Golden crispy fermented rice crepe roasted in aromatic cow ghee, sprinkled with spicy gunpowder (podi) and spiced potato mash. Accompanied by 2 crunchy fried medu vadas.",
        "house_label": "House #18 (Iyengar's Morning Tiffin)",
        "portion_size": "1 Large Masala Dosa + 2 Medu Vadas",
        "items_included": "1 Podi Masala Dosa, 2 crispy Medu Vadas, piping hot drumstick Sambar & 2 fresh coconut chutneys",
        "meal_time": "Breakfast",
        "spice_level": "Medium",
        "price": 110.0,
        "quantity": 3,
        "status": ListingStatus.PREPARING.value,
        "offset_dx": 750,
        "offset_dy": 200,
        "address": "House #18, Temple View Street",
        "neighborhood": "Temple Enclave",
        "instructions": "Currently on the tawa, ready in 10 mins. Please bring your own steel tiffin box if possible.",
        "dietary": "100% Pure Veg",
        "image": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80",
        "seller_id": "seller-priya",
        "seller_name": "Priya Nair"
    },
    {
        "food_name": "Crispy Punjabi Samosas with Chai (Plate of 4)",
        "category": "Evening Snacks & Chaat",
        "description": "Ajwain-scented flaky pastry stuffed with chunky spiced potatoes, green peas, cashews, and whole roasted coriander seeds. Served with spicy mint chutney and sweet saunth tamarind dip.",
        "house_label": "House #23 (Gupta Ji's Snack Corner)",
        "portion_size": "4 Large Samosas + 2 Chutney Cups",
        "items_included": "4 golden samosas, green pudina chutney & sweet imli chutney in sealed cups",
        "meal_time": "Evening Snacks",
        "spice_level": "Spicy",
        "price": 80.0,
        "quantity": 8,
        "status": ListingStatus.READY.value,
        "offset_dx": -600,
        "offset_dy": -150,
        "address": "House #23, Sector 4 Market Road",
        "neighborhood": "Sector 4 Park View",
        "instructions": "Pick up at front veranda. Fresh batch taken out of oil 10 minutes ago.",
        "dietary": "100% Pure Veg",
        "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
        "seller_id": "seller-rajesh",
        "seller_name": "Chef Rajesh Sharma"
    },
    {
        "food_name": "Homemade Palada Payasam & Steamed Ela Ada",
        "category": "Sweets & Desserts",
        "description": "Classic pink slow-boiled Kerala Palada Payasam simmered with whole milk and caramelized sugar, paired with 2 traditional Ela Adas (banana leaf wrapped rice crepes filled with grated coconut & melted dark jaggery).",
        "house_label": "House #7A (Amma's Heritage Kitchen)",
        "portion_size": "300ml Payasam Container + 2 Ela Adas",
        "items_included": "Insulated cup of warm rich Palada Payasam and 2 fragrant banana leaf Ela Adas",
        "meal_time": "Evening Snacks",
        "spice_level": "Mild",
        "price": 120.0,
        "quantity": 5,
        "status": ListingStatus.READY.value,
        "offset_dx": -100,
        "offset_dy": 600,
        "address": "House #7A, 5th Cross, Lakeview Road",
        "neighborhood": "Lakeview Gardens",
        "instructions": "Side door bell. Sweet and soothing dessert.",
        "dietary": "100% Pure Veg, No Artificial Flavors",
        "image": "https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=600&q=80",
        "seller_id": "seller-priya",
        "seller_name": "Priya Nair"
    }
]

def seed_sample_listings(db: Session, center_lat: float, center_lon: float):
    """
    Seeds realistic Indian homemade meal listings placed around a given center GPS coordinate.
    """
    for item in INDIAN_PRESET_FOODS:
        d_lat = item["offset_dy"] / 111320.0
        d_lon = item["offset_dx"] / (111320.0 * math.cos(math.radians(center_lat)))
        
        exact_lat = round(center_lat + d_lat, 6)
        exact_lon = round(center_lon + d_lon, 6)
        
        listing_id = str(uuid.uuid4())
        approx_lat, approx_lon = obfuscate_coordinates(exact_lat, exact_lon, listing_id)

        ready_time = datetime.utcnow() - timedelta(minutes=(abs(item["offset_dx"]) % 35) + 5) if item["status"] == ListingStatus.READY.value else None

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
            quantity_available=item["quantity"],
            price=item["price"],
            currency="₹",
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
