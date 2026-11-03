import React, { useState } from 'react';
import { User, GPSLocation, UserRole } from '../types';
import { PRESET_LOCATIONS } from '../hooks/useGeolocation';
import {
  MapPin,
  ChefHat,
  Compass,
  LogOut,
  User as UserIcon,
  Sparkles,
  Shield,
  Menu,
  X,
  BookmarkCheck,
  Navigation
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  activeRoleView?: UserRole;
  currentNav: 'landing' | 'explore' | 'map' | 'reservations' | 'seller' | 'admin' | 'profile';
  onNavigate: (nav: 'landing' | 'explore' | 'map' | 'reservations' | 'seller' | 'admin' | 'profile') => void;
  isWsConnected: boolean;
  buyerLocation: GPSLocation;
  onSelectPresetLocation: (loc: { name: string; lat: number; lng: number }) => void;
  onRequestGPS?: () => void;
  onSeedData: () => void;
  isSeeding: boolean;
  onOpenAuthModal: (initialTab?: 'buyer' | 'seller' | 'admin') => void;
  onLogout: () => void;
  reservationCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentNav,
  onNavigate,
  isWsConnected,
  buyerLocation,
  onSelectPresetLocation,
  onRequestGPS,
  onSeedData,
  isSeeding,
  onOpenAuthModal,
  onLogout,
  reservationCount = 0
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[500] bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-2.5 text-left cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center text-xl shadow-md shadow-emerald-950/20 group-hover:scale-105 transition-transform">
                🍲
              </div>
              <div>
                <div className="font-black text-slate-900 text-xl tracking-tight flex items-center gap-1.5">
                  <span>SharePlate</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 -mt-0.5">
                  Homemade Food Sharing
                </div>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold text-slate-600">
              <button
                onClick={() => onNavigate('landing')}
                className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                  currentNav === 'landing' ? 'text-emerald-800 font-bold bg-emerald-50' : 'hover:text-slate-900'
                }`}
              >
                Home
              </button>

              <button
                onClick={() => onNavigate('explore')}
                className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                  currentNav === 'explore' ? 'text-emerald-800 font-bold bg-emerald-50' : 'hover:text-slate-900'
                }`}
              >
                Explore Food
              </button>

              <button
                onClick={() => onNavigate('map')}
                className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentNav === 'map' ? 'text-emerald-800 font-bold bg-emerald-50' : 'hover:text-slate-900'
                }`}
              >
                <Compass className="w-4 h-4 text-emerald-700" />
                <span>Live Map</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </button>

              {currentUser && (
                <button
                  onClick={() => onNavigate('reservations')}
                  className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                    currentNav === 'reservations' ? 'text-emerald-800 font-bold bg-emerald-50' : 'hover:text-slate-900'
                  }`}
                >
                  <BookmarkCheck className="w-4 h-4 text-emerald-700" />
                  <span>My Pickups</span>
                  {reservationCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold">
                      {reservationCount}
                    </span>
                  )}
                </button>
              )}
            </nav>
          </div>

          {/* Center Location Selector (Airbnb / Zomato style) */}
          <div className="hidden sm:flex items-center relative">
            <button
              onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span className="max-w-[150px] md:max-w-[190px] truncate">
                {buyerLocation.addressName || 'Kochi, Kerala'}
              </span>
              <span className="text-[10px] text-slate-400">▼</span>
            </button>

            {/* Dropdown Menu */}
            {isLocationDropdownOpen && (
              <div className="absolute top-12 left-0 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-fadeIn">
                <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Neighbourhood
                </div>
                {PRESET_LOCATIONS.map((loc) => (
                  <button
                    key={loc.name}
                    onClick={() => {
                      onSelectPresetLocation(loc);
                      setIsLocationDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-emerald-50 hover:text-emerald-800 font-medium transition-colors flex items-center justify-between"
                  >
                    <span>{loc.name}</span>
                    {buyerLocation.addressName === loc.name && (
                      <span className="text-emerald-600 font-bold">✓</span>
                    )}
                  </button>
                ))}

                {onRequestGPS && (
                  <div className="pt-1 mt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        onRequestGPS();
                        setIsLocationDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-blue-600 hover:bg-blue-50 font-bold transition-colors flex items-center gap-2"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Use Real GPS Location</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Real-time Indicator Pill */}
            <div
              title={isWsConnected ? 'Connected to live real-time GPS feed' : 'Connecting to real-time feed...'}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600"
            >
              <span className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-[10px]">{isWsConnected ? 'Live Feed' : 'Connecting'}</span>
            </div>

            {/* "Become a Host / Cook" CTA */}
            {currentUser?.role !== 'SELLER' && (
              <button
                onClick={() => {
                  if (currentUser) {
                    onNavigate('seller');
                  } else {
                    onOpenAuthModal('seller');
                  }
                }}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-emerald-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ChefHat className="w-4 h-4 text-amber-700" />
                <span>Become a Cook</span>
              </button>
            )}

            {/* Seed Kerala Dishes (Convenience Testing Tool) */}
            <button
              onClick={onSeedData}
              disabled={isSeeding}
              title="Add freshly cooked authentic Kerala meals to current GPS location"
              className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{isSeeding ? 'Seeding...' : 'Seed Kerala Menu'}</span>
            </button>

            {/* Role switchers for authenticated users */}
            {currentUser?.role === 'SELLER' && (
              <button
                onClick={() => onNavigate(currentNav === 'seller' ? 'explore' : 'seller')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentNav === 'seller'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>{currentNav === 'seller' ? 'Browse as Buyer' : 'My Kitchen'}</span>
              </button>
            )}

            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={() => onNavigate(currentNav === 'admin' ? 'explore' : 'admin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentNav === 'admin'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{currentNav === 'admin' ? 'Exit Admin' : 'Admin'}</span>
              </button>
            )}

            {/* User Profile / Auth Action */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-2xl border border-slate-200/80 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center">
                    {currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-slate-800 leading-tight">
                      {currentUser.full_name.split(' ')[0]}
                    </div>
                    <div className="text-[10px] text-slate-400 capitalize font-medium">
                      {currentUser.role.toLowerCase()}
                    </div>
                  </div>
                </button>

                {/* Profile Dropdown */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-fadeIn">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <div className="font-bold text-xs text-slate-900">{currentUser.full_name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          onNavigate('reservations');
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl font-medium flex items-center gap-2"
                      >
                        <BookmarkCheck className="w-3.5 h-3.5 text-emerald-700" />
                        <span>My Food Pickups</span>
                      </button>

                      {currentUser.role !== 'SELLER' && (
                        <button
                          onClick={() => {
                            onNavigate('seller');
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl font-medium flex items-center gap-2"
                        >
                          <ChefHat className="w-3.5 h-3.5 text-amber-700" />
                          <span>Seller Kitchen Mode</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          onOpenAuthModal();
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl font-medium flex items-center gap-2"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                        <span>Switch Persona / Login</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          onLogout();
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-bold flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuthModal('buyer')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Log In
                </button>
                <button
                  onClick={() => onOpenAuthModal('buyer')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white shadow-sm transition-all cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-200 space-y-3 animate-fadeIn">
            {/* Mobile Location Selector */}
            <div className="px-2 pb-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Your Neighbourhood
              </label>
              <select
                value={buyerLocation.addressName || ''}
                onChange={(e) => {
                  const found = PRESET_LOCATIONS.find((l) => l.name === e.target.value);
                  if (found) onSelectPresetLocation(found);
                }}
                className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 py-2 px-3 rounded-xl"
              >
                {PRESET_LOCATIONS.map((loc) => (
                  <option key={loc.name} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 px-2">
              <button
                onClick={() => {
                  onNavigate('landing');
                  setIsMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-xl text-xs font-bold text-center ${
                  currentNav === 'landing' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => {
                  onNavigate('explore');
                  setIsMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-xl text-xs font-bold text-center ${
                  currentNav === 'explore' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Explore Food
              </button>
              <button
                onClick={() => {
                  onNavigate('map');
                  setIsMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-xl text-xs font-bold text-center ${
                  currentNav === 'map' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Live 3D Map
              </button>
              <button
                onClick={() => {
                  onNavigate('reservations');
                  setIsMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-xl text-xs font-bold text-center ${
                  currentNav === 'reservations' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                My Pickups ({reservationCount})
              </button>
            </div>

            <div className="pt-2 px-2 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  onNavigate('seller');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 flex items-center justify-center gap-2"
              >
                <ChefHat className="w-4 h-4 text-amber-700" />
                <span>Switch to Seller Kitchen</span>
              </button>

              <button
                onClick={() => {
                  onSeedData();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Seed Kerala Homemade Dishes</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
