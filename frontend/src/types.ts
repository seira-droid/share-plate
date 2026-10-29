export type ListingStatus = 'preparing' | 'ready' | 'reserved' | 'sold_out';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'seller' | 'buyer' | 'both';
  phone?: string;
  avatar_url?: string;
}

export interface Listing {
  id: string;
  seller_id: string;
  seller_name: string;
  food_name: string;
  description?: string;
  category: string;
  quantity_available: number;
  price: number;
  currency: string;
  food_image?: string;
  status: ListingStatus;
  
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
  listing_id: string;
  buyer_id: string;
  buyer_name: string;
  buyer_phone?: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  reserved_quantity: number;
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

export interface WebSocketEventPayload {
  event: 'listing_created' | 'listing_status_changed' | 'listing_reserved' | 'listing_cancelled' | 'connected' | 'filter_updated';
  data?: Listing;
  message?: string;
}
