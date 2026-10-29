-- ====================================================================
-- PostgreSQL + PostGIS Migration Schema
-- Hyperlocal Real-Time Food Availability & Live GPS Tracking System
-- ====================================================================

-- 1. Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'both',
    phone VARCHAR(32),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Food Listings Table with PostGIS Geography / Geometry Points
CREATE TABLE IF NOT EXISTS food_listings (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    seller_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_name VARCHAR(120) NOT NULL,
    food_name VARCHAR(120) NOT NULL,
    description TEXT,
    category VARCHAR(64) NOT NULL DEFAULT 'Home Meals',
    quantity_available INT NOT NULL DEFAULT 1 CHECK (quantity_available >= 0),
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(8) NOT NULL DEFAULT '$',
    food_image TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'preparing' CHECK (status IN ('preparing', 'ready', 'reserved', 'sold_out')),
    
    -- Exact Coordinates (Private - Revealed ONLY upon confirmed reservation)
    exact_latitude DOUBLE PRECISION NOT NULL,
    exact_longitude DOUBLE PRECISION NOT NULL,
    exact_geom GEOMETRY(Point, 4326),

    -- Approximate Coordinates (Public - Displayed on live buyer discovery map)
    approx_latitude DOUBLE PRECISION NOT NULL,
    approx_longitude DOUBLE PRECISION NOT NULL,
    approx_geom GEOMETRY(Point, 4326),

    pickup_address TEXT NOT NULL,
    approx_location_name VARCHAR(160) NOT NULL,
    pickup_instructions TEXT,
    dietary_tags TEXT,

    ready_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Spatial GIST Indexes for ultra-fast PostGIS radius queries
CREATE INDEX IF NOT EXISTS idx_food_listings_exact_geom ON food_listings USING GIST (exact_geom);
CREATE INDEX IF NOT EXISTS idx_food_listings_approx_geom ON food_listings USING GIST (approx_geom);
CREATE INDEX IF NOT EXISTS idx_food_listings_status ON food_listings(status);
CREATE INDEX IF NOT EXISTS idx_food_listings_category ON food_listings(category);

-- Trigger to automatically populate PostGIS geometries on insert/update
CREATE OR REPLACE FUNCTION update_food_listing_geometries()
RETURNS TRIGGER AS $$
BEGIN
    NEW.exact_geom := ST_SetSRID(ST_MakePoint(NEW.exact_longitude, NEW.exact_latitude), 4326);
    NEW.approx_geom := ST_SetSRID(ST_MakePoint(NEW.approx_longitude, NEW.approx_latitude), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_food_geometries ON food_listings;
CREATE TRIGGER trg_update_food_geometries
BEFORE INSERT OR UPDATE OF exact_latitude, exact_longitude, approx_latitude, approx_longitude
ON food_listings
FOR EACH ROW
EXECUTE FUNCTION update_food_listing_geometries();

-- 4. Reservations Table
CREATE TABLE IF NOT EXISTS reservations (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    listing_id VARCHAR(64) NOT NULL REFERENCES food_listings(id) ON DELETE CASCADE,
    buyer_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    buyer_name VARCHAR(120) NOT NULL,
    buyer_phone VARCHAR(32),
    reserved_quantity INT NOT NULL DEFAULT 1 CHECK (reserved_quantity > 0),
    status VARCHAR(32) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reservations_listing_id ON reservations(listing_id);
CREATE INDEX IF NOT EXISTS idx_reservations_buyer_id ON reservations(buyer_id);

-- PostGIS Geospatial Radius Query Example:
-- Find all listings marked READY within 3000 meters (3km) of Buyer Location (-74.0060, 40.7128)
-- SELECT id, food_name, seller_name, price,
--        ST_Distance(approx_geom::geography, ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326)::geography) / 1000.0 AS distance_km
-- FROM food_listings
-- WHERE status = 'ready'
--   AND ST_DWithin(approx_geom::geography, ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326)::geography, 3000)
-- ORDER BY distance_km ASC;

