import { Listing, ListingStatus, Reservation, User } from '../types';

const API_BASE = ''; // Relies on Vite proxy to http://localhost:8000

function getAuthHeader(userId?: string): HeadersInit {
  const currentUserId = userId || localStorage.getItem('foodshare_user_id') || 'buyer-charlie';
  return {
    'Content-Type': 'application/json',
    'X-User-Id': currentUserId
  };
}

export const api = {
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/auth/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async getCurrentUser(userId?: string): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeader(userId)
    });
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  async getNearbyFood(
    lat: number,
    lng: number,
    radiusKm: number = 5.0,
    category?: string,
    status?: string,
    search?: string,
    userId?: string
  ): Promise<Listing[]> {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      radius_km: radiusKm.toString()
    });
    if (category && category !== 'All') params.append('category', category);
    if (status && status !== 'all') params.append('status', status);
    if (search && search.trim()) params.append('search', search.trim());

    const res = await fetch(`${API_BASE}/food/nearby?${params.toString()}`, {
      headers: getAuthHeader(userId)
    });
    if (!res.ok) throw new Error('Failed to fetch nearby food listings');
    return res.json();
  },

  async getListingDetail(
    listingId: string,
    buyerLat?: number,
    buyerLng?: number,
    userId?: string
  ): Promise<Listing> {
    const params = new URLSearchParams();
    if (buyerLat !== undefined) params.append('buyer_lat', buyerLat.toString());
    if (buyerLng !== undefined) params.append('buyer_lng', buyerLng.toString());

    const url = `${API_BASE}/food/listings/${listingId}${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, {
      headers: getAuthHeader(userId)
    });
    if (!res.ok) throw new Error('Failed to fetch listing detail');
    return res.json();
  },

  async createListing(
    payload: {
      food_name: string;
      description?: string;
      category: string;
      quantity_available: number;
      price: number;
      currency?: string;
      food_image?: string;
      status: ListingStatus;
      house_label?: string;
      portion_size?: string;
      items_included?: string;
      spice_level?: string;
      meal_time?: string;
      latitude: number;
      longitude: number;
      pickup_address: string;
      approx_location_name?: string;
      pickup_instructions?: string;
      dietary_tags?: string;
    },
    userId?: string
  ): Promise<Listing> {
    const res = await fetch(`${API_BASE}/food/listings`, {
      method: 'POST',
      headers: getAuthHeader(userId),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create listing' }));
      throw new Error(err.detail || 'Failed to create listing');
    }
    return res.json();
  },

  async updateListingStatus(
    listingId: string,
    status: ListingStatus,
    userId?: string
  ): Promise<Listing> {
    const res = await fetch(`${API_BASE}/food/listings/${listingId}/status`, {
      method: 'PATCH',
      headers: getAuthHeader(userId),
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to update status' }));
      throw new Error(err.detail || 'Failed to update status');
    }
    return res.json();
  },

  async reserveListing(
    listingId: string,
    quantity: number = 1,
    buyerPhone?: string,
    userId?: string
  ): Promise<{ id: string; listing: Listing }> {
    const res = await fetch(`${API_BASE}/food/listings/${listingId}/reserve`, {
      method: 'POST',
      headers: getAuthHeader(userId),
      body: JSON.stringify({ quantity, buyer_phone: buyerPhone })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to reserve food' }));
      throw new Error(err.detail || 'Failed to reserve food');
    }
    return res.json();
  },

  async cancelReservation(
    listingId: string,
    reservationId?: string,
    userId?: string
  ): Promise<Listing> {
    const params = reservationId ? `?reservation_id=${reservationId}` : '';
    const res = await fetch(`${API_BASE}/food/listings/${listingId}/cancel${params}`, {
      method: 'POST',
      headers: getAuthHeader(userId)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to cancel reservation' }));
      throw new Error(err.detail || 'Failed to cancel reservation');
    }
    return res.json();
  },

  async getMyListings(userId?: string): Promise<Listing[]> {
    const res = await fetch(`${API_BASE}/food/my-listings`, {
      headers: getAuthHeader(userId)
    });
    if (!res.ok) throw new Error('Failed to fetch my listings');
    return res.json();
  },

  async getMyReservations(userId?: string): Promise<Reservation[]> {
    const res = await fetch(`${API_BASE}/food/my-reservations`, {
      headers: getAuthHeader(userId)
    });
    if (!res.ok) throw new Error('Failed to fetch my reservations');
    return res.json();
  },

  async seedData(lat: number, lng: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/food/seed?lat=${lat}&lng=${lng}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to seed listings');
    return res.json();
  }
};

