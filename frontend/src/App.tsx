import React, { useState, useEffect, useCallback } from 'react';
import { User, Listing, ListingStatus } from './types';
import { api } from './services/api';
import { useGeolocation, PRESET_LOCATIONS } from './hooks/useGeolocation';
import { useRealtimeFeed } from './hooks/useRealtimeFeed';
import { Navbar } from './components/Navbar';
import { BuyerDiscovery } from './components/BuyerDiscovery';
import { SellerDashboard } from './components/SellerDashboard';
import { FoodDetailModal } from './components/FoodDetailModal';
import { Bell, Sparkles, CheckCircle2, ShieldCheck, Info } from 'lucide-react';

export function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'buyer' | 'seller'>('buyer');

  // Geolocation
  const { location: buyerLocation, requestRealGPS, setManualLocation } = useGeolocation();

  // Buyer Discovery Filters
  const [radiusKm, setRadiusKm] = useState<number>(5.0);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Listings State
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState<boolean>(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  // Live Toast Notification
  const [toast, setToast] = useState<{ id: string; message: string; type: 'ready' | 'info' | 'reserve' } | null>(null);

  // Load Users on Startup
  useEffect(() => {
    async function loadInitialUsers() {
      try {
        const uList = await api.getUsers();
        setUsers(uList);
        if (uList.length > 0) {
          // Default to Buyer Charlie or saved preference
          const savedId = localStorage.getItem('foodshare_user_id');
          const defaultUser = uList.find((u) => u.id === savedId) || uList.find((u) => u.role === 'buyer') || uList[0];
          setCurrentUser(defaultUser);
        }
      } catch (e) {
        console.error('Failed to load users:', e);
      }
    }
    loadInitialUsers();
  }, []);

  // Sync active user ID to localStorage
  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('foodshare_user_id', user.id);
    // Auto switch tab if changing to a dedicated seller
    if (user.role === 'seller') {
      setActiveTab('seller');
    }
  };

  // Fetch Nearby Listings
  const fetchNearbyListings = useCallback(async () => {
    setIsLoadingListings(true);
    try {
      const data = await api.getNearbyFood(
        buyerLocation.lat,
        buyerLocation.lng,
        radiusKm,
        categoryFilter,
        statusFilter,
        searchQuery,
        currentUser?.id
      );
      setListings(data);
    } catch (e) {
      console.error('Failed to fetch nearby food listings:', e);
    } finally {
      setIsLoadingListings(false);
    }
  }, [buyerLocation.lat, buyerLocation.lng, radiusKm, categoryFilter, statusFilter, searchQuery, currentUser?.id]);

  useEffect(() => {
    fetchNearbyListings();
  }, [fetchNearbyListings]);

  // Handle Real-Time WebSocket Events
  const handleRealtimeEvent = useCallback((event: string, item: Listing) => {
    console.log(`[Realtime Event] ${event}:`, item.food_name);

    if (event === 'listing_created' || event === 'listing_status_changed' || event === 'listing_reserved' || event === 'listing_cancelled') {
      // Show notification toast
      if (item.status === 'ready') {
        setToast({
          id: Math.random().toString(),
          message: `🍲 ${item.seller_name} just marked "${item.food_name}" as READY FOR PICKUP!`,
          type: 'ready'
        });
      } else if (item.status === 'reserved') {
        setToast({
          id: Math.random().toString(),
          message: `🏷️ "${item.food_name}" was just reserved!`,
          type: 'reserve'
        });
      } else if (item.status === 'sold_out') {
        setToast({
          id: Math.random().toString(),
          message: `🍽️ "${item.food_name}" is now SOLD OUT`,
          type: 'info'
        });
      }

      // Update listings state in-place without manual refresh
      setListings((prevListings) => {
        const existingIndex = prevListings.findIndex((l) => l.id === item.id);

        // If status changed to sold_out and we are filtering for active listings, remove or update
        if (item.status === 'sold_out' && statusFilter === 'ready') {
          return prevListings.filter((l) => l.id !== item.id);
        }

        if (existingIndex >= 0) {
          const updated = [...prevListings];
          updated[existingIndex] = {
            ...updated[existingIndex],
            ...item
          };
          return updated;
        } else {
          // New listing in radius
          return [item, ...prevListings];
        }
      });

      // Update selected listing in modal if open
      setSelectedListing((current) => {
        if (current && current.id === item.id) {
          return { ...current, ...item };
        }
        return current;
      });
    }
  }, [statusFilter]);

  // Real-Time Feed Hook
  const { isConnected: isWsConnected } = useRealtimeFeed({
    userId: currentUser?.id || 'guest',
    lat: buyerLocation.lat,
    lng: buyerLocation.lng,
    radiusKm,
    onListingEvent: handleRealtimeEvent
  });

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Handle Quick Reservation
  const handleQuickReserve = async (listing: Listing) => {
    try {
      const res = await api.reserveListing(listing.id, 1, currentUser?.phone, currentUser?.id);
      setSelectedListing(res.listing);
      await fetchNearbyListings();
      setToast({
        id: Math.random().toString(),
        message: `✅ Successfully reserved ${listing.food_name}! Exact pickup location unlocked.`,
        type: 'reserve'
      });
    } catch (err: any) {
      alert(err.message || 'Failed to reserve food');
    }
  };

  // Handle Detailed Reservation
  const handleModalReserve = async (listingId: string, quantity: number, phone?: string) => {
    const res = await api.reserveListing(listingId, quantity, phone, currentUser?.id);
    setSelectedListing(res.listing);
    await fetchNearbyListings();
    setToast({
      id: Math.random().toString(),
      message: `🎉 Food Reserved! Exact house address and pickup instructions revealed.`,
      type: 'reserve'
    });
  };

  // Handle Reservation Cancellation
  const handleCancelReservation = async (listingId: string, reservationId?: string) => {
    const updated = await api.cancelReservation(listingId, reservationId, currentUser?.id);
    setSelectedListing(updated);
    await fetchNearbyListings();
    setToast({
      id: Math.random().toString(),
      message: `Reservation cancelled. Meal is back on the market.`,
      type: 'info'
    });
  };

  // Seed sample listings
  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await api.seedData(buyerLocation.lat, buyerLocation.lng);
      await fetchNearbyListings();
      setToast({
        id: Math.random().toString(),
        message: `✨ Fresh homemade dishes seeded around your GPS coordinates!`,
        type: 'info'
      });
    } catch (e: any) {
      alert(e.message || 'Failed to seed listings');
    } finally {
      setIsSeeding(false);
    }
  };

  // Open Listing Details Modal with fresh database state
  const handleOpenDetail = async (listing: Listing) => {
    try {
      const detail = await api.getListingDetail(listing.id, buyerLocation.lat, buyerLocation.lng, currentUser?.id);
      setSelectedListing(detail);
    } catch (e) {
      setSelectedListing(listing);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        users={users}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isWsConnected={isWsConnected}
        buyerLocation={buyerLocation}
        onSelectPresetLocation={(loc) => setManualLocation(loc.lat, loc.lng, loc.name)}
        onSeedData={handleSeedData}
        isSeeding={isSeeding}
      />

      {/* Floating Real-Time Live Notification Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-[9999] max-w-sm animate-bounceOnce">
          <div
            className={`p-4 rounded-2xl shadow-xl border flex items-start gap-3 backdrop-blur-md ${
              toast.type === 'ready'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30'
                : toast.type === 'reserve'
                ? 'bg-blue-600 text-white border-blue-500 shadow-blue-600/30'
                : 'bg-slate-900 text-white border-slate-700 shadow-slate-900/40'
            }`}
          >
            <span className="p-1 bg-white/20 rounded-lg flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </span>
            <div className="flex-1 text-xs">
              <div className="font-bold text-white/90 uppercase tracking-wider text-[10px]">
                Real-Time Map Update
              </div>
              <div className="font-semibold mt-0.5 leading-snug">{toast.message}</div>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-white/70 hover:text-white text-xs font-bold ml-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {activeTab === 'buyer' ? (
          <BuyerDiscovery
            buyerLocation={buyerLocation}
            listings={listings}
            radiusKm={radiusKm}
            onRadiusChange={setRadiusKm}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            selectedListing={selectedListing}
            onSelectListing={handleOpenDetail}
            onQuickReserve={handleQuickReserve}
            onMapClickLocation={(lat, lng) => setManualLocation(lat, lng, 'Pinned Map Location')}
            isLoading={isLoadingListings}
          />
        ) : (
          <SellerDashboard
            currentUserId={currentUser?.id || 'seller-priya'}
            sellerGPS={buyerLocation}
            onRefreshListings={fetchNearbyListings}
            onRequestGPS={requestRealGPS}
          />
        )}
      </main>

      {/* Food Detail Modal / Bottom Sheet */}
      {selectedListing && (
        <FoodDetailModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onReserve={handleModalReserve}
          onCancelReservation={handleCancelReservation}
          isSeller={currentUser?.id === selectedListing.seller_id}
        />
      )}

      {/* Footer Info */}
      <footer className="bg-white border-t border-slate-200/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Hyperlocal Food Sharing & Live GPS Availability Engine</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Residential Privacy Obfuscation Active</span>
            <span>•</span>
            <span>WebSocket Live Synchronization</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
