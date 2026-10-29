import React from 'react';
import { User, GPSLocation } from '../types';
import { PRESET_LOCATIONS } from '../hooks/useGeolocation';
import { MapPin, Radio, ChefHat, Compass, Users, Sparkles } from 'lucide-react';

interface NavbarProps {
  users: User[];
  currentUser: User | null;
  onSelectUser: (user: User) => void;
  activeTab: 'buyer' | 'seller';
  onTabChange: (tab: 'buyer' | 'seller') => void;
  isWsConnected: boolean;
  buyerLocation: GPSLocation;
  onSelectPresetLocation: (loc: { name: string; lat: number; lng: number }) => void;
  onSeedData: () => void;
  isSeeding: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  users,
  currentUser,
  onSelectUser,
  activeTab,
  onTabChange,
  isWsConnected,
  buyerLocation,
  onSelectPresetLocation,
  onSeedData,
  isSeeding
}) => {
  return (
    <header className="sticky top-0 z-[500] bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Live Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 text-xl font-black">
                🍲
              </div>
              <div>
                <span className="font-extrabold text-slate-900 text-lg tracking-tight">SharePlate</span>
                <span className="hidden sm:inline-block ml-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                  Hyperlocal Live Map
                </span>
              </div>
            </div>

            {/* Real-time Connection Indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700">
              <span className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{isWsConnected ? 'Live Feed Connected' : 'Connecting...'}</span>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => onTabChange('buyer')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'buyer'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-4 h-4 text-emerald-600" />
              <span>Buyer Map</span>
            </button>
            <button
              onClick={() => onTabChange('seller')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'seller'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ChefHat className="w-4 h-4 text-emerald-600" />
              <span>Seller Kitchen</span>
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* Quick GPS Location Switcher */}
            <div className="hidden lg:flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              <select
                value={buyerLocation.addressName || ''}
                onChange={(e) => {
                  const found = PRESET_LOCATIONS.find((l) => l.name === e.target.value);
                  if (found) onSelectPresetLocation(found);
                }}
                className="bg-transparent font-semibold text-slate-700 outline-none text-xs cursor-pointer"
              >
                {PRESET_LOCATIONS.map((loc) => (
                  <option key={loc.name} value={loc.name}>{loc.name}</option>
                ))}
              </select>
            </div>

            {/* Seed Data Button */}
            <button
              onClick={onSeedData}
              disabled={isSeeding}
              title="Populate authentic homemade Indian dishes around current coordinates"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>{isSeeding ? 'Seeding...' : 'Seed Indian Menu'}</span>
            </button>

            {/* User Switcher Dropdown */}
            {currentUser && (
              <div className="flex items-center gap-2 bg-slate-50 pl-2 pr-3 py-1 rounded-2xl border border-slate-200">
                <div className="w-7 h-7 rounded-full overflow-hidden bg-emerald-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {currentUser.avatar_url ? (
                    <img src={currentUser.avatar_url} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    currentUser.name.charAt(0)
                  )}
                </div>
                <div className="flex flex-col text-left">
                  <select
                    value={currentUser.id}
                    onChange={(e) => {
                      const user = users.find((u) => u.id === e.target.value);
                      if (user) onSelectUser(user);
                    }}
                    className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

