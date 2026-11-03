import React, { useState, useEffect, useCallback } from 'react';
import { User, Listing, UserRole } from './types';
import { api } from './services/api';
import { useGeolocation } from './hooks/useGeolocation';
import { useRealtimeFeed } from './hooks/useRealtimeFeed';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { BuyerDashboard } from './components/BuyerDashboard';
import { SellerDashboard } from './components/SellerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { FoodDetailModal } from './components/FoodDetailModal';
import { AuthModal } from './components/AuthModal';
import { Sparkles, ShieldCheck } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeRoleView, setActiveRoleView] = useState<UserRole>('BUYER');
  const [currentNav, setCurrentNav] = useState<'landing' | 'explore' | 'map' | 'reservations' | 'seller' | 'admin' | 'profile'>('landing');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalInitialRole, setAuthModalInitialRole] = useState<UserRole>('BUYER');

  // Geolocation
  const { location: buyerLocation, requestRealGPS, setManualLocation } = useGeolocation();

  // Filters & State
  const [radiusKm, setRadiusKm] = useState<number>(5.0);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Listings State
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState<boolean>(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [myReservationsCount, setMyReservationsCount] = useState<number>(0);

  // Live Toast Notification
  const [toast, setToast] = useState<{ id: string; message: string; type: 'ready' | 'info' | 'reserve' } | null>(null);

  // Load Session on Startup
  useEffect(() => {
    async function loadInitialSession() {
      try {
        const me = await api.getMe();
        setCurrentUser(me);
        setActiveRoleView(me.role);
        if (me.role === 'SELLER') setCurrentNav('seller');
        else if (me.role === 'ADMIN') setCurrentNav('admin');
      } catch {
        // Guest user mode - stays on landing
      }
    }
    loadInitialSession();
  }, []);

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
        searchQuery
      );
      setListings(data);
    } catch (e) {
      console.error('Failed to fetch nearby food listings:', e);
    } finally {
      setIsLoadingListings(false);
    }
  }, [buyerLocation.lat, buyerLocation.lng, radiusKm, categoryFilter, statusFilter, searchQuery]);

  useEffect(() => {
    fetchNearbyListings();
  }, [fetchNearbyListings]);

  // Load active reservations count for current user
  const refreshReservationCount = useCallback(async () => {
    if (!currentUser) {
      setMyReservationsCount(0);
      return;
    }
    try {
      const reservations = await api.getMyReservations();
      setMyReservationsCount(reservations.length);
    } catch {
      // Ignored if unauthenticated
    }
  }, [currentUser]);

  useEffect(() => {
    refreshReservationCount();
  }, [refreshReservationCount]);

  // Handle Real-Time WebSocket Events
  const handleRealtimeEvent = useCallback((event: string, item: Listing) => {
    console.log(`[Realtime Event] ${event}:`, item?.food_name);

    if (
      event === 'listing_created' ||
      event === 'listing_status_changed' ||
      event === 'listing_reserved' ||
      event === 'listing_cancelled'
    ) {
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
          message: `🍽️ "${item.food_name}" is now sold out`,
          type: 'info'
        });
      }

      setListings((prevListings) => {
        const existingIndex = prevListings.findIndex((l) => l.id === item.id);
        if (item.status === 'sold_out' && statusFilter === 'ready') {
          return prevListings.filter((l) => l.id !== item.id);
        }

        if (existingIndex >= 0) {
          const updated = [...prevListings];
          updated[existingIndex] = { ...updated[existingIndex], ...item };
          return updated;
        } else {
          return [item, ...prevListings];
        }
      });

      setSelectedListing((current) => {
        if (current && current.id === item.id) {
          return { ...current, ...item };
        }
        return current;
      });

      refreshReservationCount();
    } else if (event === 'listing_deleted') {
      setListings((prev) => prev.filter((l) => l.id !== (item as any)?.id));
      setToast({
        id: Math.random().toString(),
        message: 'A food listing was removed by administration.',
        type: 'info'
      });
    }
  }, [statusFilter, refreshReservationCount]);

  // Real-Time Feed Hook
  const { isConnected: isWsConnected } = useRealtimeFeed({
    userId: currentUser?.id || 'guest',
    lat: buyerLocation.lat,
    lng: buyerLocation.lng,
    radiusKm,
    onListingEvent: handleRealtimeEvent
  });

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Auth Success Handler
  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveRoleView(user.role);
    if (user.role === 'SELLER') setCurrentNav('seller');
    else if (user.role === 'ADMIN') setCurrentNav('admin');
    else setCurrentNav('explore');

    setToast({
      id: Math.random().toString(),
      message: `Signed in as ${user.full_name} (${user.role})`,
      type: 'info'
    });
    fetchNearbyListings();
    refreshReservationCount();
  };

  // Sign Out Handler
  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setActiveRoleView('BUYER');
    setCurrentNav('landing');
    setMyReservationsCount(0);
    setToast({
      id: Math.random().toString(),
      message: 'Logged out successfully',
      type: 'info'
    });
  };

  // Quick Reserve Handler
  const handleQuickReserve = async (listing: Listing) => {
    if (!currentUser) {
      setAuthModalInitialRole('BUYER');
      setIsAuthModalOpen(true);
      return;
    }
    try {
      const res = await api.reserveListing(listing.id, 1, currentUser?.phone);
      setSelectedListing(res.listing);
      await fetchNearbyListings();
      await refreshReservationCount();
      setToast({
        id: Math.random().toString(),
        message: `✅ Reserved ${listing.food_name}! Door address unlocked.`,
        type: 'reserve'
      });
    } catch (err: any) {
      alert(err.message || 'Failed to reserve food');
    }
  };

  // Detailed Modal Reserve
  const handleModalReserve = async (listingId: string, quantity: number, phone?: string) => {
    if (!currentUser) {
      setAuthModalInitialRole('BUYER');
      setIsAuthModalOpen(true);
      return;
    }
    const res = await api.reserveListing(listingId, quantity, phone);
    setSelectedListing(res.listing);
    await fetchNearbyListings();
    await refreshReservationCount();
    setToast({
      id: Math.random().toString(),
      message: `🎉 Food Reserved! Exact house address and pickup instructions revealed.`,
      type: 'reserve'
    });
  };

  // Cancel Reservation
  const handleCancelReservation = async (listingId: string, reservationId?: string) => {
    const updated = await api.cancelReservation(listingId, reservationId);
    setSelectedListing(updated);
    await fetchNearbyListings();
    await refreshReservationCount();
    setToast({
      id: Math.random().toString(),
      message: 'Reservation cancelled. Portion restored to kitchen.',
      type: 'info'
    });
  };

  // Seed sample authentic Kerala dishes
  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await api.seedData(buyerLocation.lat, buyerLocation.lng);
      await fetchNearbyListings();
      setToast({
        id: Math.random().toString(),
        message: `✨ Authentic Kerala dishes seeded around ${buyerLocation.addressName || 'your coordinates'}!`,
        type: 'info'
      });
    } catch (e: any) {
      alert(e.message || 'Failed to seed listings');
    } finally {
      setIsSeeding(false);
    }
  };

  // Open Details Modal
  const handleOpenDetail = async (listing: Listing) => {
    try {
      const detail = await api.getListingDetail(listing.id, buyerLocation.lat, buyerLocation.lng);
      setSelectedListing(detail);
    } catch {
      setSelectedListing(listing);
    }
  };

  // Open Auth Modal with initial role
  const handleOpenAuthModal = (initialTab: 'buyer' | 'seller' | 'admin' = 'buyer') => {
    setAuthModalInitialRole(initialTab === 'seller' ? 'SELLER' : initialTab === 'admin' ? 'ADMIN' : 'BUYER');
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-700 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        activeRoleView={activeRoleView}
        currentNav={currentNav}
        onNavigate={setCurrentNav}
        isWsConnected={isWsConnected}
        buyerLocation={buyerLocation}
        onSelectPresetLocation={(loc) => setManualLocation(loc.lat, loc.lng, loc.name)}
        onRequestGPS={requestRealGPS}
        onSeedData={handleSeedData}
        isSeeding={isSeeding}
        onOpenAuthModal={handleOpenAuthModal}
        onLogout={handleLogout}
        reservationCount={myReservationsCount}
      />

      {/* Floating Real-Time Live Notification Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-[9999] max-w-sm animate-bounceOnce">
          <div
            className={`p-4 rounded-2xl shadow-xl border flex items-start gap-3 backdrop-blur-md ${
              toast.type === 'ready'
                ? 'bg-emerald-800 text-white border-emerald-600 shadow-emerald-950/20'
                : toast.type === 'reserve'
                ? 'bg-blue-800 text-white border-blue-600 shadow-blue-950/20'
                : 'bg-slate-900 text-white border-slate-700 shadow-slate-950/20'
            }`}
          >
            <span className="p-1.5 bg-white/20 rounded-xl flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </span>
            <div className="flex-1 text-xs text-left">
              <div className="font-bold text-white/80 uppercase tracking-wider text-[10px]">
                Real-Time Live Update
              </div>
              <div className="font-semibold mt-0.5 leading-snug">{toast.message}</div>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-white/70 hover:text-white text-xs font-bold ml-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {currentNav === 'landing' && (
          <LandingPage
            listings={listings}
            buyerLocation={buyerLocation}
            onExploreFood={() => setCurrentNav('explore')}
            onOpenMap={() => setCurrentNav('map')}
            onBecomeSeller={() => {
              if (currentUser) setCurrentNav('seller');
              else handleOpenAuthModal('seller');
            }}
            onSelectListing={handleOpenDetail}
            onOpenAuthModal={handleOpenAuthModal}
            onSelectLocationPreset={(loc) => setManualLocation(loc.lat, loc.lng, loc.name)}
          />
        )}

        {(currentNav === 'explore' || currentNav === 'map' || currentNav === 'reservations' || currentNav === 'profile') && (
          <BuyerDashboard
            currentUser={currentUser}
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
            onRequestGPS={requestRealGPS}
            isLoading={isLoadingListings}
            activeTab={currentNav === 'map' ? 'map' : currentNav === 'reservations' ? 'reservations' : currentNav === 'profile' ? 'profile' : 'explore'}
            onTabChange={(tab) => setCurrentNav(tab)}
            onOpenAuthModal={() => handleOpenAuthModal('buyer')}
          />
        )}

        {currentNav === 'seller' && (
          <SellerDashboard
            currentUserId={currentUser?.id || 'seller-lakshmi'}
            sellerGPS={buyerLocation}
            onRefreshListings={fetchNearbyListings}
            onRequestGPS={requestRealGPS}
          />
        )}

        {currentNav === 'admin' && (
          <AdminDashboard
            currentUser={currentUser}
            onRefreshData={fetchNearbyListings}
          />
        )}
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialRole={authModalInitialRole}
        currentGPS={buyerLocation}
      />

      {/* Food Detail Modal */}
      {selectedListing && (
        <FoodDetailModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onReserve={handleModalReserve}
          onCancelReservation={handleCancelReservation}
          isSeller={currentUser?.id === selectedListing.seller_id}
        />
      )}

      {/* Professional Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-8 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-800 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                🍲
              </span>
              <span className="font-extrabold text-slate-900 text-sm">SharePlate</span>
              <span className="text-slate-400">•</span>
              <span>Hyperlocal Homemade Food Sharing Platform</span>
            </div>

            <div className="flex items-center gap-4 text-slate-500 font-medium">
              <button onClick={() => setCurrentNav('landing')} className="hover:text-emerald-800 cursor-pointer">Home</button>
              <button onClick={() => setCurrentNav('explore')} className="hover:text-emerald-800 cursor-pointer">Explore Food</button>
              <button onClick={() => setCurrentNav('map')} className="hover:text-emerald-800 cursor-pointer">Live 3D Map</button>
              <button onClick={() => handleOpenAuthModal('seller')} className="hover:text-emerald-800 cursor-pointer">Become a Host</button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-400 text-[11px]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Residential Privacy Obfuscation Protected</span>
              <span>•</span>
              <span>MapLibre 3D Vector Engine</span>
            </div>
            <div>
              © 2026 SharePlate. Connecting neighbourhood kitchens with hungry neighbors.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
