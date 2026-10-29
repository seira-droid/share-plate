import math
import hashlib

EARTH_RADIUS_KM = 6371.0088

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points on the Earth's surface
    using the Haversine formula.
    """
    if lat1 == lat2 and lon1 == lon2:
        return 0.0

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    
    # Numerical safeguard for float precision
    a = min(1.0, max(0.0, a))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_KM * c

def calculate_bounding_box(lat: float, lon: float, radius_km: float):
    """
    Calculate a rough bounding box (min_lat, max_lat, min_lon, max_lon)
    for pre-filtering database records before calculating exact Haversine distance.
    """
    # 1 deg latitude is approx 111.32 km
    delta_lat = radius_km / 111.32
    
    # 1 deg longitude varies with latitude: 111.32 * cos(lat)
    cos_lat = math.cos(math.radians(lat))
    if abs(cos_lat) < 1e-6:
        delta_lon = 180.0
    else:
        delta_lon = radius_km / (111.32 * abs(cos_lat))

    min_lat = max(-90.0, lat - delta_lat)
    max_lat = min(90.0, lat + delta_lat)
    min_lon = max(-180.0, lon - delta_lon)
    max_lon = min(180.0, lon + delta_lon)

    return min_lat, max_lat, min_lon, max_lon

def obfuscate_coordinates(exact_lat: float, exact_lon: float, listing_id: str = "", offset_meters: float = 160.0):
    """
    Residential Privacy Protection:
    Performs deterministic privacy fuzzing by shifting the exact household coordinates
    by an offset radius (typically ~120 - 200m).
    This keeps the marker in the general neighborhood without revealing the seller's
    exact door or home address until a reservation is confirmed.
    """
    # Use deterministic hash of listing_id or coordinates so the approximate marker stays stable
    hash_seed = hashlib.md5(f"{listing_id}:{exact_lat:.5f}:{exact_lon:.5f}".encode()).hexdigest()
    int_seed = int(hash_seed[:8], 16)
    
    angle = (int_seed % 360) * (math.pi / 180.0)
    # Distance between 100m and 180m
    dist_m = 100.0 + (int_seed % 80)
    
    # Convert meters to degrees
    d_lat = (dist_m * math.cos(angle)) / 111320.0
    d_lon = (dist_m * math.sin(angle)) / (111320.0 * math.cos(math.radians(exact_lat)))
    
    approx_lat = round(exact_lat + d_lat, 6)
    approx_lon = round(exact_lon + d_lon, 6)
    return approx_lat, approx_lon

def format_distance(distance_km: float) -> str:
    """Format distance into human-readable string (e.g. '350 m' or '1.8 km')"""
    if distance_km < 1.0:
        return f"{int(distance_km * 1000)} m"
    return f"{distance_km:.1f} km"

