import React, { useState, useEffect, useMemo } from 'react';
import { User, Listing, GPSLocation, Reservation } from '../types';
import { FoodCard } from './FoodCard';
import { MapLibre3DMap } from './MapLibre3DMap';
import { BuyerMap } from './BuyerMap';
import { api } from '../services/api';
import {
  Compass,
  Search,
  MapPin,
  Clock,
  Heart,
  SlidersHorizontal,
  CheckCircle2,
  BookmarkCheck,
  User as UserIcon,
  Navigation,
  ExternalLink,
  Flame,
  Utensils,
  Layers,
  ArrowRight,
  RefreshCw,
  Phone,
  ShieldCheck,
  X
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
  activeTab?: 'explore' | 'map' | 'reservations' | 'profile';
  onTabChange?: (tab: 'explore' | 'map' | 'reservations' | 'profile') => void;
  onOpenAuthModal?: () => void;
}

const CATEGORIES = [
  { name: 'All', icon: '🍽️' },
  { name: 'Kerala Homestyle', icon: '🍛' },
  { name: 'Traditional Thali', icon: '🍱' },
  { name: 'Biryani & Rice', icon: '🥘' },
  { name: 'South Indian Tiffin', icon: '🥞' },
  { name: 'North Indian Curries', icon: '🍲' },
  { name: 'Evening Snacks & Chaat', icon: '🥟' },
  { name: 'Sweets & Desserts', icon: '🍯' }
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
  isLoading = false,
  activeTab = 'explore',
  onTabChange,
  onOpenAuthModal
}) => {
  const [internalTab, setInternalTab] = useState<'explore' | 'map' | 'reservations' | 'profile'>(activeTab);
  const currentTab = onTabChange ? activeTab : internalTab;

  const handleTabSwitch = (tab: 'explore' | 'map' | 'reservations' | 'profile') => {
    if (onTabChange) onTabChange(tab);
    else setInternalTab(tab);
  };

  const [mapEngine, setMapEngine] = useState<'3d' | '2d'>('3d');
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [activeMapPreview, setActiveMapPreview] = useState<Listing | null>(null);

  // Quick filter toggles
  const [vegOnly, setVegOnly] = useState(false);
  const [readyOnly, setReadyOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'ready'>('distance');

  // Load reservations when the reservations tab opens
  const loadReservations = async () => {
    if (!currentUser) return;
    setLoadingReservations(true);
    try {
      const data = await api.getMyReservations();
      setMyReservations(data);
    } catch (err) {
      console.error('Failed to load reservations:', err);
    } finally {
      setLoadingReservations(false);
    }
  };

  useEffect(() => {
    if (currentTab === 'reservations') {
      loadReservations();
    }
  }, [currentTab, currentUser]);

  // Filtered & Sorted Listings
  const processedListings = useMemo(() => {
    let result = [...listings];

    if (vegOnly) {
      result = result.filter(
        (l) =>
          l.dietary_tags?.toLowerCase().includes('veg') &&
          !l.dietary_tags?.toLowerCase().includes('non-veg')
      );
    }

    if (readyOnly) {
      result = result.filter((l) => l.status === 'ready');
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'ready') {
        if (a.status === 'ready' && b.status !== 'ready') return -1;
        if (b.status === 'ready' && a.status !== 'ready') return 1;
      }
      return (a.distance_km || 999) - (b.distance_km || 999);
    });

    return result;
  }, [listings, vegOnly, readyOnly, sortBy]);

  // Ready Now listings for top carousel
  const readyListings = useMemo(() => {
    return listings.filter((l) => l.status === 'ready');
  }, [listings]);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* =========================================================================
          VIEW SWITCHER TABS (Clean Airbnb / Swiggy style)
          ========================================================================= */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => handleTabSwitch('explore')}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              currentTab === 'explore'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Discover Food</span>
          </button>

          <button
            onClick={() => handleTabSwitch('map')}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              currentTab === 'map'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Live 3D Map</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          <button
            onClick={() => handleTabSwitch('reservations')}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              currentTab === 'reservations'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookmarkCheck className="w-4 h-4 text-emerald-400" />
            <span>My Pickups</span>
            {myReservations.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold">
                {myReservations.length}
              </span>
            )}
          </button>
        </div>

        {/* Location Display */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin className="w-3.5 h-3.5 text-emerald-700" />
          <span>Area: <strong className="text-slate-800">{buyerLocation.addressName || 'Kochi'}</strong></span>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: EXPLORE / DISCOVERY VIEW
          ========================================================================= */}
      {currentTab === 'explore' && (
        <div className="space-y-6">
          {/* Top Search & Filter Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search homemade dishes, cooks, ingredients (Biryani, Porotta, Sadhya, Dosa...)"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-slate-50/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Radius Selector */}
              <div className="flex items-center gap-1.5 self-start md:self-auto overflow-x-auto pb-1 md:pb-0">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
                  Radius:
                </span>
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => onRadiusChange(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      radiusKm === r
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Filter Chips (Ready Now, Pure Veg, Sorting) */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
              <button
                onClick={() => setReadyOnly(!readyOnly)}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  readyOnly
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${readyOnly ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`} />
                <span>Ready for Pickup Now</span>
              </button>

              <button
                onClick={() => setVegOnly(!vegOnly)}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  vegOnly
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full border border-emerald-600 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                </span>
                <span>Pure Veg Only</span>
              </button>

              <div className="ml-auto flex items-center gap-1.5 text-slate-500">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent font-bold text-slate-700 outline-none text-xs cursor-pointer"
                >
                  <option value="distance">Nearest First</option>
                  <option value="ready">Ready Status First</option>
                  <option value="price">Price: Low to High</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => onCategoryChange(cat.name)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  categoryFilter === cat.name
                    ? 'bg-emerald-900 text-white shadow-md shadow-emerald-950/15'
                    : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Hot Ready Right Now Carousel (if any exist) */}
          {readyListings.length > 0 && !readyOnly && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    Steaming Hot & Ready for Pickup Now
                  </h3>
                </div>
                <span className="text-xs font-bold text-emerald-800">
                  {readyListings.length} dishes ready
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {readyListings.slice(0, 3).map((listing) => (
                  <FoodCard
                    key={`ready-${listing.id}`}
                    listing={listing}
                    onSelect={onSelectListing}
                    onQuickReserve={onQuickReserve}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Main All Listings Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-lg">
                {categoryFilter === 'All' ? 'All Homemade Dishes Nearby' : `${categoryFilter} Dishes`}
                <span className="text-xs font-semibold text-slate-400 ml-2">
                  ({processedListings.length} available)
                </span>
              </h3>

              <button
                onClick={() => handleTabSwitch('map')}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
              >
                <span>View on Live Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Loading Skeleton */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-3xl h-72 border border-slate-200 animate-pulse p-4 space-y-3">
                    <div className="h-40 bg-slate-200 rounded-2xl" />
                    <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                    <div className="h-3 bg-slate-200 rounded-md w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && processedListings.length === 0 && (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3 p-6">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center text-3xl">
                  🍲
                </div>
                <h4 className="font-bold text-slate-900 text-lg">No dishes found in this radius</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Try expanding your search radius to 5 km or 10 km, or clearing filters. You can also seed fresh sample Kerala meals.
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      onRadiusChange(10);
                      onCategoryChange('All');
                      setReadyOnly(false);
                      setVegOnly(false);
                      onSearchChange('');
                    }}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>
            )}

            {/* Listings Grid */}
            {!isLoading && processedListings.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {processedListings.map((listing) => (
                  <FoodCard
                    key={listing.id}
                    listing={listing}
                    onSelect={onSelectListing}
                    onQuickReserve={onQuickReserve}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: INTEGRATED LIVE 3D / 2D MAP VIEW
          ========================================================================= */}
      {currentTab === 'map' && (
        <div className="space-y-4">
          {/* Map Header Toolbar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                <Compass className="w-4 h-4 text-emerald-700" />
                <span>Live Interactive Map</span>
              </div>

              {/* Status Legend */}
              <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-600 border-l border-slate-200 pl-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Ready Now
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Cooking
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Reserved
                </span>
              </div>
            </div>

            {/* Radius & 2D/3D Engine Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={`map-rad-${r}`}
                    onClick={() => onRadiusChange(r)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      radiusKm === r ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    {r}km
                  </button>
                ))}
              </div>

              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl">
                <button
                  onClick={() => setMapEngine('3d')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mapEngine === '3d' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  3D Vector
                </button>
                <button
                  onClick={() => setMapEngine('2d')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mapEngine === '2d' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  2D OpenStreet
                </button>
              </div>
            </div>
          </div>

          {/* Map Container with Preview Bottom Sheet */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 shadow-md h-[550px] md:h-[650px] w-full">
            {mapEngine === '3d' ? (
              <MapLibre3DMap
                buyerLocation={buyerLocation}
                listings={processedListings}
                radiusKm={radiusKm}
                selectedListing={selectedListing || activeMapPreview}
                onSelectListing={(listing) => {
                  setActiveMapPreview(listing);
                  onSelectListing(listing);
                }}
                onQuickReserve={onQuickReserve}
                onMapClickLocation={onMapClickLocation}
              />
            ) : (
              <BuyerMap
                buyerLocation={buyerLocation}
                listings={processedListings}
                radiusKm={radiusKm}
                selectedListing={selectedListing || activeMapPreview}
                onSelectListing={(listing) => {
                  setActiveMapPreview(listing);
                  onSelectListing(listing);
                }}
                onQuickReserve={onQuickReserve}
                onMapClickLocation={onMapClickLocation}
              />
            )}

            {/* Floating Map Info Overlays */}
            <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-slate-200/80 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-bold text-slate-800">{processedListings.length} dishes in radius</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 text-[11px]">~160m Privacy Perimeter Active</span>
            </div>

            {/* Clicked Dish Bottom Sheet / Floating Card Preview */}
            {activeMapPreview && (
              <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-20 animate-scaleUp">
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-4 space-y-3 relative">
                  <button
                    onClick={() => setActiveMapPreview(null)}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex gap-3">
                    <img
                      src={
                        activeMapPreview.image_url ||
                        activeMapPreview.food_image ||
                        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={activeMapPreview.food_name}
                      className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                        {activeMapPreview.category}
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm truncate">
                        {activeMapPreview.food_name}
                      </h4>
                      <p className="text-xs text-slate-500 truncate">
                        {activeMapPreview.seller_name} • {activeMapPreview.house_label || 'Home Kitchen'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-black text-emerald-800 text-sm">₹{activeMapPreview.price}</span>
                        {activeMapPreview.distance_formatted && (
                          <span className="text-[11px] text-slate-500 font-medium">
                            • {activeMapPreview.distance_formatted}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onSelectListing(activeMapPreview)}
                      className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold text-center cursor-pointer"
                    >
                      View Details
                    </button>

                    <button
                      onClick={() => onQuickReserve(activeMapPreview)}
                      className="flex-1 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold text-center cursor-pointer shadow-xs"
                    >
                      Reserve Portion
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: MY RESERVATIONS & PICKUPS
          ========================================================================= */}
      {currentTab === 'reservations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                My Food Pickups & Reservations
              </h3>
              <p className="text-xs text-slate-500">
                Your confirmed portions. Exact residential addresses and host instructions are unlocked below.
              </p>
            </div>

            <button
              onClick={loadReservations}
              disabled={loadingReservations}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingReservations ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {!currentUser && (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <BookmarkCheck className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-900 text-base">Sign in to view your pickups</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Log in to check your confirmed portions, unlocked door numbers, and walking directions.
              </p>
              {onOpenAuthModal && (
                <button
                  onClick={() => onOpenAuthModal()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-800 text-white text-xs font-bold cursor-pointer"
                >
                  Sign In / Register
                </button>
              )}
            </div>
          )}

          {currentUser && myReservations.length === 0 && !loadingReservations && (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center text-2xl">
                🍱
              </div>
              <h4 className="font-bold text-slate-900 text-base">No active reservations yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Discover hot meals prepared right now by nearby neighbors and reserve your portion!
              </p>
              <button
                onClick={() => handleTabSwitch('explore')}
                className="px-5 py-2.5 rounded-xl bg-emerald-800 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-2"
              >
                <span>Find Food Near You</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {currentUser && myReservations.length > 0 && (
            <div className="space-y-4">
              {myReservations.map((res) => (
                <div
                  key={res.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
                          {res.status === 'confirmed' ? '✓ Pickup Confirmed' : res.status}
                        </span>
                        <span className="text-xs text-slate-400">Order #{res.id.slice(0, 8)}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-lg mt-1">
                        {res.food_name || res.listing?.food_name || 'Homemade Meal'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Prepared by <strong className="text-slate-800">{res.seller_name || res.listing?.seller_name}</strong>
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-base font-black text-emerald-800">
                        {res.quantity} portion{res.quantity > 1 ? 's' : ''} reserved
                      </div>
                      <div className="text-xs text-slate-500">
                        Total: ₹{((res.listing?.price || 0) * res.quantity).toFixed(0)}
                      </div>
                    </div>
                  </div>

                  {/* UNLOCKED RESIDENTIAL ADDRESS BANNER */}
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>Exact Pickup Address & Host Instructions (Unlocked)</span>
                    </div>

                    <div className="text-sm font-semibold text-slate-900 pl-5">
                      📍 {res.listing?.pickup_address || 'Address unlocked upon confirmation'}
                    </div>

                    {res.listing?.pickup_instructions && (
                      <div className="text-xs text-slate-700 pl-5 italic">
                        💬 "{res.listing.pickup_instructions}"
                      </div>
                    )}

                    {/* Google Maps Directions Link */}
                    {res.listing && (
                      <div className="pl-5 pt-1">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${res.listing.latitude},${res.listing.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition-colors"
                        >
                          <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Get Walking Directions in Google Maps</span>
                          <ExternalLink className="w-3 h-3 text-emerald-600" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 4: PROFILE VIEW
          ========================================================================= */}
      {currentTab === 'profile' && (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-800 text-white font-black text-2xl flex items-center justify-center">
              {currentUser?.full_name ? currentUser.full_name.charAt(0) : 'U'}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{currentUser?.full_name || 'Guest User'}</h3>
              <p className="text-xs text-slate-500">{currentUser?.email || 'Not logged in'}</p>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider mt-1">
                Role: {currentUser?.role || 'Guest'}
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">Phone Number</span>
              <span className="font-semibold text-slate-800">{currentUser?.phone || '+91 98460-11223 (Demo)'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">Active Coordinates</span>
              <span className="font-semibold text-slate-800">
                {buyerLocation.lat.toFixed(4)}, {buyerLocation.lng.toFixed(4)} ({buyerLocation.addressName})
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Account Status</span>
              <span className="font-bold text-emerald-700 capitalize">{currentUser?.account_status || 'Active'}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex gap-3">
            <button
              onClick={() => handleTabSwitch('explore')}
              className="flex-1 py-2.5 rounded-xl bg-emerald-800 text-white text-xs font-bold text-center cursor-pointer"
            >
              Browse Food Nearby
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MOBILE BOTTOM NAVIGATION (Sticky on mobile devices < 768px)
          ========================================================================= */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[400] bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => handleTabSwitch('explore')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            currentTab === 'explore' ? 'text-emerald-800' : 'text-slate-400'
          }`}
        >
          <Utensils className="w-5 h-5" />
          <span>Discover</span>
        </button>

        <button
          onClick={() => handleTabSwitch('map')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            currentTab === 'map' ? 'text-emerald-800' : 'text-slate-400'
          }`}
        >
          <div className="relative">
            <Compass className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <span>3D Map</span>
        </button>

        <button
          onClick={() => handleTabSwitch('reservations')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            currentTab === 'reservations' ? 'text-emerald-800' : 'text-slate-400'
          }`}
        >
          <div className="relative">
            <BookmarkCheck className="w-5 h-5" />
            {myReservations.length > 0 && (
              <span className="absolute -top-1 -right-2 px-1 rounded-full bg-emerald-600 text-white text-[9px]">
                {myReservations.length}
              </span>
            )}
          </div>
          <span>Pickups</span>
        </button>

        <button
          onClick={() => handleTabSwitch('profile')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            currentTab === 'profile' ? 'text-emerald-800' : 'text-slate-400'
          }`}
        >
          <UserIcon className="w-5 h-5" />
          <span>Profile</span>
        </button>
      </div>
    </div>
  );
};
