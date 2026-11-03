import React, { useState } from 'react';
import { User, UserRole, GPSLocation } from '../types';
import { api } from '../services/api';
import {
  User as UserIcon,
  ChefHat,
  Shield,
  X,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  initialRole?: UserRole;
  currentGPS?: GPSLocation;
}

// Sample demo identities for fast testing
const SAMPLE_BUYERS = [
  { id: 'buyer-ananya', name: 'Ananya Menon', email: 'ananya.menon@foodnearby.in', area: 'Panampilly Nagar, Kochi' },
  { id: 'buyer-arjun', name: 'Arjun Nair', email: 'arjun.nair@foodnearby.in', area: 'Kadavanthra, Kochi' },
  { id: 'buyer-priya', name: 'Priya Sharma', email: 'priya.sharma@foodnearby.in', area: 'Ravipuram, Kochi' }
];

const SAMPLE_SELLERS = [
  { id: 'seller-lakshmi', name: 'Lakshmi Menon', kitchen: "Lakshmi's Traditional Kitchen", email: 'lakshmi.menon@foodnearby.in' },
  { id: 'seller-suresh', name: 'Suresh Babu', kitchen: "Suresh's Spice Kitchen", email: 'suresh.babu@foodnearby.in' },
  { id: 'seller-divya', name: 'Divya Nair', kitchen: "Divya's Appam Corner", email: 'divya.nair@foodnearby.in' }
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialRole = 'BUYER',
  currentGPS
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showDemoLogins, setShowDemoLogins] = useState<boolean>(false);

  // Form Fields
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // Seller specific fields
  const [kitchenName, setKitchenName] = useState<string>('');
  const [pickupLocation, setPickupLocation] = useState<string>('');

  if (!isOpen) return null;

  const handleRoleTabChange = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage('');
    if (role === 'ADMIN') {
      setIsRegisterMode(false);
      setEmail('admin@foodnearby.in');
      setPassword('Admin@FoodNearby2026');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const handleDemoQuickLogin = async (userType: 'buyer' | 'seller' | 'admin', identifier: string) => {
    setLoading(true);
    setErrorMessage('');
    try {
      if (userType === 'admin') {
        const res = await api.adminLogin('admin@foodnearby.in', 'Admin@FoodNearby2026');
        onAuthSuccess(res.user);
        onClose();
        return;
      }

      const res = await api.demoLogin(identifier);
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      if (selectedRole === 'ADMIN') {
        const res = await api.adminLogin(email, password);
        onAuthSuccess(res.user);
        onClose();
        return;
      }

      if (isRegisterMode) {
        if (selectedRole === 'SELLER') {
          if (!kitchenName.trim()) throw new Error('Please enter your kitchen name');
          const res = await api.registerSeller({
            full_name: fullName,
            email,
            phone,
            password,
            kitchen_name: kitchenName,
            pickup_location: pickupLocation || currentGPS?.addressName || 'Panampilly Nagar, Kochi',
            latitude: currentGPS?.lat || 9.9625,
            longitude: currentGPS?.lng || 76.2990
          });
          onAuthSuccess(res.user);
        } else {
          const res = await api.registerBuyer({
            full_name: fullName,
            email,
            phone,
            password,
            latitude: currentGPS?.lat,
            longitude: currentGPS?.lng
          });
          onAuthSuccess(res.user);
        }
      } else {
        const res = await api.login(email, password);
        onAuthSuccess(res.user);
      }

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn"
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-5 animate-scaleUp text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center text-xl shadow-md">
            🍲
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {isRegisterMode ? 'Create Your Account' : 'Welcome to SharePlate'}
          </h2>
          <p className="text-xs text-slate-500">
            {isRegisterMode
              ? 'Join your neighbourhood food sharing circle.'
              : 'Sign in to discover homemade meals or manage your kitchen.'}
          </p>
        </div>

        {/* Role Tab Selector (Buyer / Seller / Admin) */}
        <div className="flex rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => handleRoleTabChange('BUYER')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              selectedRole === 'BUYER' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Buyer</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleTabChange('SELLER')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              selectedRole === 'SELLER' ? 'bg-white text-amber-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Home Cook</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleTabChange('ADMIN')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              selectedRole === 'ADMIN' ? 'bg-white text-rose-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Shield className="w-3 h-3" />
            <span>Admin</span>
          </button>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegisterMode && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Ananya Menon"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g. yourname@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
            />
          </div>

          {isRegisterMode && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number</label>
              <input
                type="tel"
                required
                placeholder="+91 98460-XXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
              />
            </div>
          )}

          {isRegisterMode && selectedRole === 'SELLER' && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Kitchen / Home Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. House #12B (Lakshmi's Traditional Kitchen)"
                  value={kitchenName}
                  onChange={(e) => setKitchenName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Private Door Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 12B, Panampilly Nagar Main Road, Kochi"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-2xl text-white font-bold text-xs shadow-md transition-all cursor-pointer ${
              selectedRole === 'SELLER'
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-900/15'
                : selectedRole === 'ADMIN'
                ? 'bg-rose-700 hover:bg-rose-800 shadow-rose-900/15'
                : 'bg-emerald-800 hover:bg-emerald-900 shadow-emerald-950/15'
            }`}
          >
            {loading
              ? 'Authenticating...'
              : isRegisterMode
              ? `Register as ${selectedRole === 'SELLER' ? 'Home Cook' : 'Buyer'}`
              : `Sign In as ${selectedRole === 'SELLER' ? 'Home Cook' : selectedRole === 'ADMIN' ? 'Admin' : 'Buyer'}`}
          </button>
        </form>

        {/* Toggle Register / Login */}
        {selectedRole !== 'ADMIN' && (
          <div className="text-center text-xs text-slate-500 pt-1">
            {isRegisterMode ? (
              <span>
                Already have an account?{' '}
                <button
                  onClick={() => setIsRegisterMode(false)}
                  className="font-bold text-emerald-800 hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                New to SharePlate?{' '}
                <button
                  onClick={() => setIsRegisterMode(true)}
                  className="font-bold text-emerald-800 hover:underline cursor-pointer"
                >
                  Register here
                </button>
              </span>
            )}
          </div>
        )}

        {/* DEMO FAST-LOGIN (1-Click for evaluators) */}
        <div className="pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowDemoLogins(!showDemoLogins)}
            className="w-full text-center text-[11px] font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>{showDemoLogins ? '▲ Hide Demo Accounts' : '▼ 1-Click Demo Testing Accounts'}</span>
          </button>

          {showDemoLogins && (
            <div className="mt-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 animate-fadeIn">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Sample Buyers (Tap to login):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_BUYERS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleDemoQuickLogin('buyer', b.id)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 cursor-pointer"
                  >
                    {b.name}
                  </button>
                ))}
              </div>

              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pt-1">
                Sample Home Cooks (Tap to login):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_SELLERS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleDemoQuickLogin('seller', s.id)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-900 cursor-pointer"
                  >
                    {s.name}
                  </button>
                ))}
              </div>

              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pt-1">
                Administrator:
              </div>
              <button
                type="button"
                onClick={() => handleDemoQuickLogin('admin', 'admin-root')}
                className="px-3 py-1 rounded-lg bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-800 hover:bg-rose-100 cursor-pointer"
              >
                1-Click Admin Access (Admin Root)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
