import React, { useState } from 'react';
import { User, Listing, GPSLocation, Reservation } from '../types';
import { MapLibre3DMap } from './MapLibre3DMap';
import { BuyerMap } from './BuyerMap';
import { api } from '../services/api';
import {
  Compass,
  Search,
  Sparkles,
  MapPin,
  Clock,
  Heart,
  ShoppingBag,
  SlidersHorizontal,
  Home,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  User as UserIcon,
  Navigation,
  Package
} from 'lucide-react';

interface BuyerDashboardProps {
  currentUser: User | null;
  buyerLocation: GPSLocation;
  listings: Listing[];
  radiusKm: number;
  onRadiusChange: (radius: number) => void;
  categoryFilter: string;
  onCategoryChange: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  selectedListing: Listing | null;
  onSelectListing: (listing: Listing) => void;
  onQuickReserve: (listing: Listing) => void;
  onMapClickLocation?: (lat: number, lng: number) => void;
  onRequestGPS?: () => void;
  isLoading?: boolean;
}

const CATEGORIES = [
  'All',
  'Kerala Homestyle',
  'Traditional Thali',
  'Biryani & Rice',
  'South Indian Tiffin',
  'North Indian Curries',
  'Evening Snacks & Chaat'
];

const RADIUS_OPTIONS = [1, 3, 5, 10];

export const BuyerDashboard: React.FC<BuyerDashboardProps> = ({
  currentUser,
  buyerLocation,
  listings,
  radiusKm,
  onRadiusChange,
  categoryFilter,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  selectedListing,
  onSelectListing,
  onQuickReserve,
  onMapClickLocation,
  onRequestGPS,
  isLoading = false
}) => {
  const [navTab, setNavTab] = useState<'home' | 'explore' | 'map3d' | 'reservations' | 'favorites' | 'profile'>('home');
  const [mapEngine, setMapEngine] = useState<'3d' | '2d'>('3d');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState<boolean>(false);

  // Load reservations when opening the reservations tab
  const handleTabChange = async (tab: typeof navTab) => {
    setNavTab(tab);
    if (tab === 'reservations') {
      setLoadingReservations(true);
      try {
        const data = await api.getMyReservations();
        setMyReservations(data);
      } catch (err) {
        console.error('Failed to load reservations:', err);
      } finally {
        setLoadingReservations(false);
      }
    }
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Buyer Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white rounded-3xl shadow-xl shadow-blue-950/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-white/20 rounded-xl">🍲</span>
            <h2 className="text-xl md:text-2xl font-black">
              Namaskaram, {currentUser?.full_name || 'Neighbor'}!
            </h2>
          </div>
          <p className="text-blue-100 text-xs md:text-sm max-w-xl">
            Discover freshly prepared homemade food from neighborhood kitchens near you in Kerala. Real-time GPS availability tracking is active.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRequestGPS && (
            <button
              onClick={onRequestGPS}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl backdrop-blur-md transition-all flex items-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5 text-sky-300" />
              <span>Update GPS ({buyerLocation.lat.toFixed(4)}, {buyerLocation.lng.toFixed(4)})</span>
            </button>
          )}
        </div>
      </div>

      {/* Buyer Sub-Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => handleTabChange('home')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            navTab === 'home'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home & Map Overview</span>
        </button>

        <button
          onClick={() => handleTabChange('explore')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            navTab === 'explore'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Explore Dishes ({listings.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('map3d')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            navTab === 'map3d'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Full-Screen 3D Map</span>
        </button>

        <button
          onClick={() => handleTabChange('reservations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            navTab === 'reservations'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>My Reservations</span>
        </button>

        <button
          onClick={() => handleTabChange('favorites')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            navTab === 'favorites'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Favorites ({favorites.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            navTab === 'profile'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>Buyer Profile</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      {(navTab === 'home' || navTab === 'explore' || navTab === 'map3d') && (
        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Kerala Meals, Appam, Idiyappam, Biryani, Curries, Lemon Rice..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
            </div>

            {/* Distance Filter (1, 3, 5, 10 km) */}
            <div className="flex items-center gap-1.5 self-start md:self-auto overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
                Radius:
              </span>
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => onRadiusChange(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    radiusKm === r
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {r} km
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 self-start md:self-auto">
              <button
                onClick={() => onStatusChange(statusFilter === 'ready' ? 'all' : 'ready')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  statusFilter === 'ready'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${statusFilter === 'ready' ? 'bg-white' : 'bg-emerald-500'}`} />
                <span>Ready for Pickup Only</span>
              </button>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Tab Views */}
      {navTab === 'home' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Live Map Column */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-slate-800 text-sm">Interactive GPS Map</span>
              </div>

              {/* Map Engine Toggle */}
              <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setMapEngine('3d')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    mapEngine === '3d' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  3D Vector Engine
                </button>
                <button
                  onClick={() => setMapEngine('2d')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    mapEngine === '2d' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  2D Classic
                </button>
              </div>
            </div>

            {mapEngine === '3d' ? (
              <MapLibre3DMap
                buyerLocation={buyerLocation}
                listings={listings}
                radiusKm={radiusKm}
                selectedListing={selectedListing}
                onSelectListing={onSelectListing}
                onQuickReserve={onQuickReserve}
                onMapClickLocation={onMapClickLocation}
              />
            ) : (
              <BuyerMap
                buyerLocation={buyerLocation}
                listings={listings}
                radiusKm={radiusKm}
                selectedListing={selectedListing}
                onSelectListing={onSelectListing}
                onQuickReserve={onQuickReserve}
                onMapClickLocation={onMapClickLocation}
              />
            )}
          </div>

          {/* Nearby Dishes Feed Column */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="font-bold text-slate-800 text-sm">
                Nearby Dishes ({listings.length})
              </span>
              <span className="text-xs text-slate-400">Nearest first</span>
            </div>

            <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
              {isLoading ? (
                <div className="p-12 text-center text-slate-400 text-xs">Finding hot homemade meals nearby...</div>
              ) : listings.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-2">
                  <div className="text-3xl">🍲</div>
                  <p className="font-semibold text-slate-700">No dishes within {radiusKm} km</p>
                  <p>Try widening your search radius to 5 or 10 km.</p>
                  <button
                    onClick={() => onRadiusChange(10)}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 font-bold rounded-xl"
                  >
                    Expand to 10 km
                  </button>
                </div>
              ) : (
                listings.map((listing) => (
                  <div
                    key={listing.id}
                    onClick={() => onSelectListing(listing)}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex gap-3 text-xs"
                  >
                    <img
                      src={listing.food_image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d'}
                      alt={listing.food_name}
                      className="w-20 h-20 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md truncate">
                            {listing.category}
                          </span>
                          <span className="font-black text-slate-900 text-sm">₹{listing.price.toFixed(0)}</span>
                        </div>

                        <h4 className="font-bold text-slate-900 text-sm mt-0.5 truncate">{listing.food_name}</h4>

                        <div className="text-slate-500 text-[11px] truncate">
                          By <strong>{listing.seller_name}</strong> {listing.house_label ? `• ${listing.house_label}` : ''}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-blue-700 font-bold text-[11px]">
                          📍 {listing.distance_formatted || `${listing.distance_km?.toFixed(2) || '0.8'} km`}
                        </span>

                        {listing.status === 'ready' && listing.quantity_available > 0 ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onQuickReserve(listing);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] shadow-sm transition-all active:scale-95 flex items-center gap-1"
                          >
                            <span>Reserve</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">
                            {listing.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Explore Full Grid */}
      {navTab === 'explore' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((listing) => (
            <div
              key={listing.id}
              onClick={() => onSelectListing(listing)}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 w-full bg-slate-100">
                  <img
                    src={listing.food_image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d'}
                    alt={listing.food_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-slate-900/85 backdrop-blur-md text-white font-black text-sm px-3 py-1 rounded-full">
                    ₹{listing.price.toFixed(0)}
                  </div>

                  <button
                    onClick={(e) => toggleFavorite(listing.id, e)}
                    className="absolute top-3 left-3 p-2 rounded-full bg-white/80 backdrop-blur-md text-slate-700 hover:text-rose-600 shadow-sm transition-colors"
                  >
                    <Heart
                      className={`w-4 h-4 ${favorites.includes(listing.id) ? 'fill-rose-500 text-rose-500' : ''}`}
                    />
                  </button>

                  <div className="absolute bottom-3 left-3">
                    {listing.status === 'ready' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-md flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                        FOOD IS READY
                      </span>
                    )}
                    {listing.status === 'preparing' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-md">
                        Cooking Now
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md">
                      {listing.category}
                    </span>
                    <span className="font-semibold text-emerald-700">
                      {listing.quantity_available} portions left
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-base">{listing.food_name}</h4>
                  <p className="text-xs text-slate-500">
                    Prepared by <strong>{listing.seller_name}</strong> {listing.house_label ? `• ${listing.house_label}` : ''}
                  </p>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                    <div className="flex items-center gap-1 font-semibold text-slate-800">
                      <Package className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{listing.portion_size || '1 Full Plate'}</span>
                    </div>
                    {listing.items_included && (
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {listing.items_included}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-blue-700 font-bold text-xs">
                  📍 {listing.distance_formatted || `${listing.distance_km?.toFixed(2) || '0.8'} km away`}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickReserve(listing);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
                >
                  Reserve Food
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Full-Screen 3D Map */}
      {navTab === 'map3d' && (
        <div className="space-y-3">
          <MapLibre3DMap
            buyerLocation={buyerLocation}
            listings={listings}
            radiusKm={radiusKm}
            selectedListing={selectedListing}
            onSelectListing={onSelectListing}
            onQuickReserve={onQuickReserve}
            onMapClickLocation={onMapClickLocation}
          />
        </div>
      )}

      {/* Tab: My Reservations */}
      {navTab === 'reservations' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Your Active & Past Food Reservations</h3>
              <p className="text-xs text-slate-500">
                Exact house door pickup addresses are securely revealed upon confirmed reservation.
              </p>
            </div>
          </div>

          {loadingReservations ? (
            <div className="p-12 text-center text-slate-400 text-xs">Loading reservations...</div>
          ) : myReservations.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-2">
              <ShoppingBag className="w-8 h-8 text-blue-500 mx-auto" />
              <p className="font-bold text-slate-700">No reservations placed yet.</p>
              <p>Explore nearby dishes and click "Reserve Food" to secure a hot homemade meal.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myReservations.map((res) => (
                <div
                  key={res.id}
                  className="p-5 bg-gradient-to-r from-blue-50/70 to-slate-50 rounded-2xl border border-blue-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                        {res.status || res.reservation_status || 'Confirmed'}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        Order #{res.id.slice(0, 8)}
                      </span>
                    </div>

                    <h4 className="font-black text-slate-900 text-base">
                      {res.listing?.food_name || res.food_name || 'Homemade Meal'} ({res.quantity} portion{res.quantity > 1 ? 's' : ''})
                    </h4>

                    <div className="text-slate-600">
                      Cooked by: <strong className="text-slate-800">{res.listing?.seller_name || res.seller_name || 'Home Cook'}</strong>
                    </div>

                    {/* Unlocked House Address */}
                    <div className="p-3 bg-white rounded-xl border border-emerald-300 text-emerald-950 font-semibold space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Pickup Location Unlocked:</span>
                      </div>
                      <div className="text-xs">
                        {res.listing?.pickup_address || 'House #14B, 2nd Cross, Panampilly Nagar'}
                      </div>
                      {res.listing?.pickup_instructions && (
                        <div className="text-[11px] text-slate-600 font-normal">
                          <strong>Note:</strong> {res.listing.pickup_instructions}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end justify-between gap-2 border-t md:border-t-0 pt-3 md:pt-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold block">Total Amount</span>
                      <span className="text-2xl font-black text-slate-900">
                        ₹{(res.total_price || (res.listing?.price ? res.listing.price * res.quantity : 0)).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Favorites */}
      {navTab === 'favorites' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Saved Dishes & Favorite Kitchens</h3>
          {favorites.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
              <Heart className="w-8 h-8 text-rose-400 mx-auto mb-2" />
              <span>You haven't added any dishes to your favorites yet. Click the heart icon on any meal.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings
                .filter((l) => favorites.includes(l.id))
                .map((listing) => (
                  <div
                    key={listing.id}
                    onClick={() => onSelectListing(listing)}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer text-xs space-y-2"
                  >
                    <div className="font-bold text-slate-900 text-sm">{listing.food_name}</div>
                    <div className="text-slate-500">₹{listing.price} • {listing.seller_name}</div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Buyer Profile */}
      {navTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm max-w-xl mx-auto space-y-5 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xl">
              {currentUser?.full_name?.charAt(0) || 'B'}
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">{currentUser?.full_name || 'Buyer'}</h3>
              <p className="text-slate-500">{currentUser?.email || 'buyer@example.com'}</p>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                Verified Community Buyer
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="font-bold text-slate-700 text-xs">GPS Location Permission:</div>
            <div className="text-slate-600 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>
                Coordinates: {buyerLocation.lat.toFixed(5)}, {buyerLocation.lng.toFixed(5)} ({buyerLocation.addressName || 'Kochi'})
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              🔒 Residential privacy active: Exact house addresses are masked until your reservation is accepted.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

