import React from 'react';
import { User, GPSLocation, UserRole } from '../types';
import { PRESET_LOCATIONS } from '../hooks/useGeolocation';
import {
  MapPin,
  Radio,
  ChefHat,
  Compass,
  Users,
  Sparkles,
  Shield,
  LogOut,
  LogIn,
  User as UserIcon
} from 'lucide-react';

interface NavbarProps {
  users: User[];
  currentUser: User | null;
  onSelectUser: (user: User) => void;
  activeRoleView: UserRole;
  onRoleViewChange: (role: UserRole) => void;
  isWsConnected: boolean;
  buyerLocation: GPSLocation;
  onSelectPresetLocation: (loc: { name: string; lat: number; lng: number }) => void;
  onSeedData: () => void;
  isSeeding: boolean;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  users,
  currentUser,
  onSelectUser,
  activeRoleView,
  onRoleViewChange,
  isWsConnected,
  buyerLocation,
  onSelectPresetLocation,
  onSeedData,
  isSeeding,
  onOpenAuthModal,
  onLogout
}) => {
  return (
    <header className="sticky top-0 z-[500] bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Platform Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 text-xl font-black">
                🍲
              </div>
              <div>
                <span className="font-extrabold text-slate-900 text-lg tracking-tight">FoodNearby</span>
                <span className="hidden sm:inline-block ml-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                  Hyperlocal 3D Map
                </span>
              </div>
            </div>

            {/* Real-time Connection Indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700">
              <span className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{isWsConnected ? '3D GPS Live' : 'Connecting...'}</span>
            </div>
          </div>

          {/* Role Navigation Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => onRoleViewChange('BUYER')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeRoleView === 'BUYER'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Buyer Map</span>
            </button>

            <button
              onClick={() => onRoleViewChange('SELLER')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeRoleView === 'SELLER'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Seller Kitchen</span>
            </button>

            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={() => onRoleViewChange('ADMIN')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeRoleView === 'ADMIN'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-rose-700 hover:text-rose-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            )}
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

            {/* Seed Authentic Indian Menu */}
            <button
              onClick={onSeedData}
              disabled={isSeeding}
              title="Populate authentic homemade Kerala dishes around current coordinates"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>{isSeeding ? 'Seeding...' : 'Seed Kerala Dishes'}</span>
            </button>

            {/* Authentication / Persona Switcher */}
            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-50 pl-2 pr-2 py-1 rounded-2xl border border-slate-200">
                <div
                  className={`w-7 h-7 rounded-full overflow-hidden text-white flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                    currentUser.role === 'ADMIN'
                      ? 'bg-rose-600'
                      : currentUser.role === 'SELLER'
                      ? 'bg-orange-600'
                      : 'bg-blue-600'
                  }`}
                >
                  {currentUser.avatar_url ? (
                    <img src={currentUser.avatar_url} alt={currentUser.full_name} className="w-full h-full object-cover" />
                  ) : (
                    currentUser.full_name.charAt(0)
                  )}
                </div>

                <div className="flex flex-col text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {currentUser.full_name}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {currentUser.role}
                  </span>
                </div>

                <button
                  onClick={onOpenAuthModal}
                  title="Switch Role or Account"
                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors text-xs ml-1"
                >
                  <Users className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
