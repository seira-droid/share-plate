import React, { useState } from 'react';
import { User, UserRole, GPSLocation } from '../types';
import { api } from '../services/api';
import {
  User as UserIcon,
  ChefHat,
  Shield,
  MapPin,
  Lock,
  Mail,
  Phone,
  Home,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  initialRole?: UserRole;
  currentGPS?: GPSLocation;
}

// Sample identities defined in prompt
const SAMPLE_BUYERS = [
  { id: 'buyer-ananya', name: 'Ananya Menon', email: 'ananya@example.com', phone: '+91 98471 22334', area: 'Kochi (Panampilly Nagar)' },
  { id: 'buyer-arjun', name: 'Arjun Nair', email: 'arjun@example.com', phone: '+91 98472 33445', area: 'Kochi (Kadavanthra)' },
  { id: 'buyer-priya', name: 'Priya Sharma', email: 'priya@example.com', phone: '+91 98473 44556', area: 'Kochi (Ravipuram)' },
  { id: 'buyer-rahul', name: 'Rahul Varma', email: 'rahul@example.com', phone: '+91 98474 55667', area: 'Kochi (Marine Drive)' },
  { id: 'buyer-meera', name: 'Meera Krishnan', email: 'meera@example.com', phone: '+91 98475 66778', area: 'Kochi (Ernakulam South)' }
];

const SAMPLE_SELLERS = [
  { id: 'seller-lakshmi', name: 'Lakshmi Menon', kitchen: "Lakshmi's Kitchen (Illam)", email: 'lakshmi@foodnearby.in', dish: 'Kerala Vegetable Meals (₹30)' },
  { id: 'seller-suresh', name: 'Suresh Babu', kitchen: 'Kochi Spice Kitchen', email: 'suresh@foodnearby.in', dish: 'Homemade Chicken Curry (₹50)' },
  { id: 'seller-divya', name: 'Divya Nair', kitchen: 'Malabar Tiffin Center', email: 'divya@foodnearby.in', dish: 'Appam & Vegetable Stew (₹40)' },
  { id: 'seller-kavitha', name: 'Kavitha Raj', kitchen: 'Amma Veg Haven', email: 'kavitha@foodnearby.in', dish: 'Homemade Idiyappam (₹25)' },
  { id: 'seller-anil', name: 'Anil Kumar', kitchen: 'South Flavors Home', email: 'anil@foodnearby.in', dish: 'Lemon Rice (₹20)' }
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

  // Form Fields
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  
  // Seller specific fields
  const [houseAddress, setHouseAddress] = useState<string>('');
  const [kitchenName, setKitchenName] = useState<string>('');

  if (!isOpen) return null;

  const handleRoleTabChange = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage('');
    if (role === 'ADMIN') {
      setIsRegisterMode(false); // Admin has no public registration
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

      // Try demo quick login first
      const res = await api.demoLogin(identifier);
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      // Fallback: standard login with default password
      try {
        const emailMap: Record<string, string> = {
          'buyer-ananya': 'ananya@example.com',
          'buyer-arjun': 'arjun@example.com',
          'buyer-priya': 'priya@example.com',
          'buyer-rahul': 'rahul@example.com',
          'buyer-meera': 'meera@example.com',
          'seller-lakshmi': 'lakshmi@foodnearby.in',
          'seller-suresh': 'suresh@foodnearby.in',
          'seller-divya': 'divya@foodnearby.in',
          'seller-kavitha': 'kavitha@foodnearby.in',
          'seller-anil': 'anil@foodnearby.in'
        };
        const emailToUse = emailMap[identifier] || identifier;
        const passToUse = userType === 'buyer' ? 'Buyer@2026' : 'Seller@2026';
        const res = await api.login(emailToUse, passToUse);
        onAuthSuccess(res.user);
        onClose();
      } catch (innerErr: any) {
        setErrorMessage(innerErr.message || 'Demo login failed');
      }
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
        const res = await api.adminLogin(email.trim(), password);
        onAuthSuccess(res.user);
        onClose();
        return;
      }

      if (isRegisterMode) {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        if (selectedRole === 'BUYER') {
          const res = await api.registerBuyer({
            full_name: fullName.trim(),
            email: email.trim(),
            phone: phone.trim() || '+91 98471 00000',
            password,
            latitude: currentGPS?.lat || 9.9625,
            longitude: currentGPS?.lng || 76.2990
          });
          onAuthSuccess(res.user);
          onClose();
        } else if (selectedRole === 'SELLER') {
          if (!kitchenName.trim() || !houseAddress.trim()) {
            throw new Error('Please fill out Kitchen Name and House Address');
          }
          const res = await api.registerSeller({
            full_name: fullName.trim(),
            email: email.trim(),
            phone: phone.trim() || '+91 98472 00000',
            password,
            kitchen_name: kitchenName.trim(),
            pickup_location: houseAddress.trim(),
            latitude: currentGPS?.lat || 9.9630,
            longitude: currentGPS?.lng || 76.2995
          });
          onAuthSuccess(res.user);
          onClose();
        }
      } else {
        // Normal Login
        const res = await api.login(email.trim(), password);
        // Verify role constraint
        if (selectedRole === 'BUYER' && res.user.role !== 'BUYER') {
          throw new Error(`This account is registered as ${res.user.role}. Please select the ${res.user.role} tab.`);
        }
        if (selectedRole === 'SELLER' && res.user.role !== 'SELLER') {
          throw new Error(`This account is registered as ${res.user.role}. Please select the ${res.user.role} tab.`);
        }
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header with Close */}
        <div className="px-6 pt-6 pb-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-white/10 rounded-xl">🍲</span>
              <h3 className="font-extrabold text-xl tracking-tight">FoodNearby Authentication</h3>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Select your role to access your dedicated dashboard.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Role Selection Tabs */}
        <div className="grid grid-cols-3 p-2 bg-slate-100 border-b border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => handleRoleTabChange('BUYER')}
            className={`py-3 px-2 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all ${
              selectedRole === 'BUYER'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Buyer Portal</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleTabChange('SELLER')}
            className={`py-3 px-2 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all ${
              selectedRole === 'SELLER'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>Seller Portal</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleTabChange('ADMIN')}
            className={`py-3 px-2 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all ${
              selectedRole === 'ADMIN'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Admin Login</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick-Login Personas (Prompt Requirement) */}
          {selectedRole === 'BUYER' && (
            <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>1-Click Sample Indian Buyers:</span>
                </span>
                <span className="text-[10px] text-blue-600 font-semibold">Ready to Test</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_BUYERS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    disabled={loading}
                    onClick={() => handleDemoQuickLogin('buyer', b.id)}
                    className="px-2.5 py-1.5 bg-white hover:bg-blue-600 hover:text-white text-slate-700 border border-blue-200 rounded-xl text-xs font-semibold shadow-sm transition-all text-left flex items-center gap-1.5"
                  >
                    <span>👤</span>
                    <span>{b.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedRole === 'SELLER' && (
            <div className="p-4 bg-orange-50/70 border border-orange-100 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-orange-950 flex items-center gap-1.5">
                  <ChefHat className="w-3.5 h-3.5 text-orange-600" />
                  <span>1-Click Sample Indian Home Kitchens:</span>
                </span>
                <span className="text-[10px] text-orange-600 font-semibold">Live Dishes Seeded</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {SAMPLE_SELLERS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    disabled={loading}
                    onClick={() => handleDemoQuickLogin('seller', s.id)}
                    className="p-2 bg-white hover:bg-orange-600 hover:text-white text-slate-800 border border-orange-200 rounded-xl text-xs font-semibold shadow-sm transition-all text-left group"
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>{s.name}</span>
                      <span className="text-[10px] group-hover:text-orange-200 text-orange-700 font-semibold">{s.dish}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 group-hover:text-orange-100">{s.kitchen}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedRole === 'ADMIN' && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                <Shield className="w-4 h-4 text-rose-600" />
                <span>Protected Administrative Gateway</span>
              </div>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                Admin accounts are strictly restricted and cannot be created through public registration. Use authorized platform administrator credentials.
              </p>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoQuickLogin('admin', 'admin@foodnearby.in')}
                className="w-full py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <span>🔑 Log in as Platform Administrator (admin@foodnearby.in)</span>
              </button>
            </div>
          )}

          {/* Mode Switch (Login vs Register) - ONLY for Buyer & Seller */}
          {selectedRole !== 'ADMIN' && (
            <div className="flex items-center justify-center gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setIsRegisterMode(false)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  !isRegisterMode
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {selectedRole === 'BUYER' ? 'Buyer Login' : 'Seller Login'}
              </button>
              <button
                type="button"
                onClick={() => setIsRegisterMode(true)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isRegisterMode
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {selectedRole === 'BUYER' ? 'Buyer Registration' : 'Seller Registration'}
              </button>
            </div>
          )}

          {/* Main Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegisterMode && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder={selectedRole === 'BUYER' ? 'e.g. Ananya Menon' : 'e.g. Lakshmi Menon'}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                  />
                </div>
              </div>
            )}

            {isRegisterMode && selectedRole === 'SELLER' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Food Preparation Location / Kitchen Name *
                  </label>
                  <div className="relative">
                    <ChefHat className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lakshmi's Illam Kitchen"
                      value={kitchenName}
                      onChange={(e) => setKitchenName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    House / Business Address (Residential privacy protected) *
                  </label>
                  <div className="relative">
                    <Home className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. House #14B, 2nd Cross, Panampilly Nagar"
                      value={houseAddress}
                      onChange={(e) => setHouseAddress(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50/50"
                    />
                  </div>
                </div>
              </>
            )}

            {isRegisterMode && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98471 22334"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder={
                    selectedRole === 'ADMIN'
                      ? 'admin@foodnearby.in'
                      : selectedRole === 'SELLER'
                      ? 'seller@foodnearby.in'
                      : 'buyer@example.com'
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                />
              </div>
            </div>

            {isRegisterMode && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                  />
                </div>
              </div>
            )}

            {isRegisterMode && currentGPS && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  <strong>GPS Location Pin:</strong> {currentGPS.lat.toFixed(4)}, {currentGPS.lng.toFixed(4)} ({currentGPS.addressName || 'Current GPS'})
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 font-bold text-sm text-white rounded-xl shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 ${
                selectedRole === 'BUYER'
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
                  : selectedRole === 'SELLER'
                  ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/30'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
              }`}
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>
                    {selectedRole === 'ADMIN'
                      ? 'Sign in to Admin Dashboard'
                      : isRegisterMode
                      ? `Register as ${selectedRole === 'BUYER' ? 'Buyer' : 'Seller'}`
                      : `Sign In as ${selectedRole === 'BUYER' ? 'Buyer' : 'Seller'}`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

