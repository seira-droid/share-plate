import type {
  Listing,
  ListingStatus,
  Reservation,
  User,
  AuthResponse,
  AdminOverviewStats,
  ReportItem
} from '../types';

const API_BASE = ''; // Relies on Vite proxy to FastAPI backend

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('foodnearby_jwt_token');
  const userId = localStorage.getItem('foodshare_user_id');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (userId) {
    headers['X-User-Id'] = userId;
  }
  return headers;
}

export const api = {
  // -------------------------------------------------------------
  // Authentication & Session
  // -------------------------------------------------------------
  async registerBuyer(payload: {
    full_name: string;
    email: string;
    phone: string;
    password: string;
    latitude?: number;
    longitude?: number;
  }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/register/buyer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Buyer registration failed' }));
      throw new Error(err.detail || 'Buyer registration failed');
    }
    const data: AuthResponse = await res.json();
    localStorage.setItem('foodnearby_jwt_token', data.access_token);
    localStorage.setItem('foodshare_user_id', data.user.id);
    return data;
  },

  async registerSeller(payload: {
    full_name: string;
    email: string;
    phone: string;
    password: string;
    kitchen_name: string;
    pickup_location: string;
    latitude: number;
    longitude: number;
  }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/register/seller`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Seller registration failed' }));
      throw new Error(err.detail || 'Seller registration failed');
    }
    const data: AuthResponse = await res.json();
    localStorage.setItem('foodnearby_jwt_token', data.access_token);
    localStorage.setItem('foodshare_user_id', data.user.id);
    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(err.detail || 'Invalid email or password');
    }
    const data: AuthResponse = await res.json();
    localStorage.setItem('foodnearby_jwt_token', data.access_token);
    localStorage.setItem('foodshare_user_id', data.user.id);
    return data;
  },

  async adminLogin(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Admin login failed' }));
      throw new Error(err.detail || 'Invalid administrator credentials');
    }
    const data: AuthResponse = await res.json();
    localStorage.setItem('foodnearby_jwt_token', data.access_token);
    localStorage.setItem('foodshare_user_id', data.user.id);
    return data;
  },

  async demoLogin(userId: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/demo-login/${userId}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Demo login failed');
    const data: AuthResponse = await res.json();
    localStorage.setItem('foodnearby_jwt_token', data.access_token);
    localStorage.setItem('foodshare_user_id', data.user.id);
    return data;
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Session invalid');
    return res.json();
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/auth/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  logout() {
    localStorage.removeItem('foodnearby_jwt_token');
    localStorage.removeItem('foodshare_user_id');
  },

  // -------------------------------------------------------------
  // Food Listings
  // -------------------------------------------------------------
  async getNearbyFood(
    lat: number,
    lng: number,
    radiusKm: number = 5.0,
    category?: string,
    status?: string,
    search?: string,
    _userId?: string
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
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch nearby food listings');
    return res.json();
  },

  async getListingDetail(
    listingId: string,
    buyerLat?: number,
    buyerLng?: number,
    _userId?: string
  ): Promise<Listing> {
    const params = new URLSearchParams();
    if (buyerLat !== undefined) params.append('buyer_lat', buyerLat.toString());
    if (buyerLng !== undefined) params.append('buyer_lng', buyerLng.toString());

    const url = `${API_BASE}/food/listings/${listingId}${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch listing detail');
    return res.json();
  },

  async createListing(payload: {
    food_name: string;
    description?: string;
    category: string;
    quantity?: number;
    quantity_available?: number;
    price: number;
    currency?: string;
    image_url?: string;
    food_image?: string;
    status?: string;
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
  }, _userId?: string): Promise<Listing> {
    const bodyPayload = {
      ...payload,
      quantity: payload.quantity ?? payload.quantity_available ?? 1,
      image_url: payload.image_url || payload.food_image
    };
    const res = await fetch(`${API_BASE}/food/listings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(bodyPayload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create listing' }));
      throw new Error(err.detail || 'Failed to create listing');
    }
    return res.json();
  },

  async updateListingStatus(listingId: string, status: ListingStatus, _userId?: string): Promise<Listing> {
    const res = await fetch(`${API_BASE}/food/listings/${listingId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to update status' }));
      throw new Error(err.detail || 'Failed to update status');
    }
    return res.json();
  },

  async reserveListing(listingId: string, quantity: number = 1, buyerPhone?: string, _userId?: string): Promise<{ id: string; listing: Listing }> {
    const res = await fetch(`${API_BASE}/food/listings/${listingId}/reserve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ quantity, buyer_phone: buyerPhone })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to reserve food' }));
      throw new Error(err.detail || 'Failed to reserve food');
    }
    return res.json();
  },

  async cancelReservation(listingId: string, reservationId?: string, _userId?: string): Promise<Listing> {
    const params = reservationId ? `?reservation_id=${reservationId}` : '';
    const res = await fetch(`${API_BASE}/food/listings/${listingId}/cancel${params}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to cancel reservation' }));
      throw new Error(err.detail || 'Failed to cancel reservation');
    }
    return res.json();
  },

  async getMyListings(_userId?: string): Promise<Listing[]> {
    const res = await fetch(`${API_BASE}/food/my-listings`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch my listings');
    return res.json();
  },

  async getMyReservations(): Promise<Reservation[]> {
    const res = await fetch(`${API_BASE}/food/my-reservations`, {
      headers: getAuthHeaders()
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
  },

  // -------------------------------------------------------------
  // Administrator Endpoints
  // -------------------------------------------------------------
  async getAdminOverview(): Promise<AdminOverviewStats> {
    const res = await fetch(`${API_BASE}/admin/overview`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Forbidden' }));
      throw new Error(err.detail || 'Failed to fetch admin overview');
    }
    return res.json();
  },

  async getAdminUsers(role?: string, status?: string): Promise<User[]> {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (status) params.append('status', status);

    const res = await fetch(`${API_BASE}/admin/users?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async verifySeller(sellerId: string, verification_status: string, account_status?: string): Promise<User> {
    const res = await fetch(`${API_BASE}/admin/sellers/${sellerId}/verify`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ verification_status, account_status })
    });
    if (!res.ok) throw new Error('Failed to update seller verification');
    return res.json();
  },

  async getAdminListings(status?: string): Promise<any[]> {
    const params = status ? `?status=${status}` : '';
    const res = await fetch(`${API_BASE}/admin/listings${params}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch admin listings');
    return res.json();
  },

  async removeListingByAdmin(listingId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/listings/${listingId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete listing');
  },

  async getAdminReservations(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/admin/reservations`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch reservations');
    return res.json();
  },

  async getAdminReports(): Promise<ReportItem[]> {
    const res = await fetch(`${API_BASE}/admin/reports`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch reports');
    return res.json();
  },

  async submitReport(payload: { reported_listing_id?: string; reported_user_id?: string; reason: string }): Promise<ReportItem> {
    const res = await fetch(`${API_BASE}/admin/reports`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to submit report');
    return res.json();
  }
};
