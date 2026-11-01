export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN';

export type ListingStatus = 'preparing' | 'ready' | 'reserved' | 'sold_out';

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  account_status: 'active' | 'suspended' | 'pending_approval';
  avatar_url?: string;
  kitchen_name?: string;
  pickup_location?: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Listing {
  id: string;
  seller_id: string;
  seller_name: string;
  food_name: string;
  description?: string;
  category: string;
  quantity: number;
  quantity_available: number;
  price: number;
  currency: string;
  image_url?: string;
  food_image?: string;
  status: ListingStatus;
  availability_status?: string;
  
  // Household & Portion Customization
  house_label?: string;
  portion_size?: string;
  items_included?: string;
  spice_level?: string;
  meal_time?: string;

  // Coordinates
  latitude: number;
  longitude: number;
  is_exact_location: boolean;
  location_name: string;
  
  distance_km?: number;
  distance_formatted?: string;
  ready_at?: string;
  time_since_ready?: string;
  dietary_tags?: string;
  created_at: string;
  
  // Revealed when authorized (seller or active buyer)
  pickup_address?: string;
  pickup_instructions?: string;
  reserved_by_current_user?: boolean;
  active_reservation_id?: string;
}

export interface Reservation {
  id: string;
  food_listing_id?: string;
  listing_id?: string;
  food_name?: string;
  seller_name?: string;
  buyer_id: string;
  buyer_name: string;
  buyer_phone?: string;
  quantity: number;
  reserved_quantity?: number;
  total_price?: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  reservation_status?: string;
  created_at: string;
  listing?: Listing;
}

export interface GPSLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  status: 'locating' | 'granted' | 'denied' | 'fallback';
  addressName?: string;
}

export interface AdminOverviewStats {
  total_users: number;
  active_buyers: number;
  active_sellers: number;
  available_listings: number;
  ready_for_pickup: number;
  active_reservations: number;
  completed_transactions: number;
  reported_listings_count: number;
  total_gmv_rupees: number;
}

export interface ReportItem {
  id: string;
  reporter_id: string;
  reported_listing_id?: string;
  reported_user_id?: string;
  reason: string;
  status: string;
  created_at: string;
}

export interface WebSocketEventPayload {
  event: 'listing_created' | 'listing_status_changed' | 'listing_reserved' | 'listing_cancelled' | 'listing_deleted' | 'connected' | 'filter_updated';
  data?: any;
  message?: string;
}
