import React, { useState, useEffect, useMemo } from 'react';
import { User, AdminOverviewStats, ReportItem } from '../types';
import { api } from '../services/api';
import {
  Shield,
  Users,
  ChefHat,
  ShoppingBag,
  TrendingUp,
  Trash2,
  RefreshCw,
  Search
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User | null;
  onRefreshData?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onRefreshData }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sellers' | 'listings' | 'reservations' | 'reports'>('overview');
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [listingsList, setListingsList] = useState<any[]>([]);
  const [reservationsList, setReservationsList] = useState<any[]>([]);
  const [reportsList, setReportsList] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [overviewData, allUsers, allListings, allReservations, allReports] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminUsers(),
        api.getAdminListings(),
        api.getAdminReservations(),
        api.getAdminReports()
      ]);
      setStats(overviewData);
      setUsersList(allUsers);
      setListingsList(allListings);
      setReservationsList(allReservations);
      setReportsList(allReports);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      loadAdminData();
    }
  }, [currentUser]);

  const handleVerifySeller = async (sellerId: string, status: 'approved' | 'suspended') => {
    setActionInProgressId(sellerId);
    try {
      await api.verifySeller(sellerId, status, status === 'approved' ? 'active' : 'suspended');
      await loadAdminData();
      if (onRefreshData) onRefreshData();
    } catch (e: any) {
      alert(e.message || 'Failed to update seller verification status');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!window.confirm('Are you sure you want to remove this listing from the live map?')) {
      return;
    }
    setActionInProgressId(listingId);
    try {
      await api.removeListingByAdmin(listingId);
      await loadAdminData();
      if (onRefreshData) onRefreshData();
    } catch (e: any) {
      alert(e.message || 'Failed to delete listing');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Filtered Sellers
  const sellers = useMemo(() => {
    return usersList.filter(
      (u) =>
        u.role === 'SELLER' &&
        (u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (u.kitchen_name && u.kitchen_name.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  }, [usersList, searchTerm]);

  // Filtered Listings
  const filteredListings = useMemo(() => {
    return listingsList.filter(
      (l) =>
        l.food_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.seller_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [listingsList, searchTerm]);

  // Access check
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-rose-200 space-y-4 max-w-lg mx-auto my-12 shadow-xl">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center text-3xl">
          🛡️
        </div>
        <h3 className="font-extrabold text-xl text-rose-950">Administrative Access Required</h3>
        <p className="text-slate-500 text-xs leading-relaxed">
          The Admin Control Center is restricted to authorized platform administrators only (HTTP 403 Forbidden). Please sign in using an administrator account.
        </p>
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
          Demo Admin: <code className="font-mono text-emerald-800">admin@foodnearby.in</code>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 text-left">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-rose-400" />
            <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">
              Platform Administration
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Governance & Command Center
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm">
            Monitor real-time platform metrics, manage seller kitchen approvals, and enforce community food safety.
          </p>
        </div>

        <button
          onClick={loadAdminData}
          disabled={loading}
          className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'overview' ? 'bg-rose-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Overview & Metrics
        </button>

        <button
          onClick={() => setActiveTab('sellers')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'sellers' ? 'bg-rose-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Home Cooks ({sellers.length})
        </button>

        <button
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'listings' ? 'bg-rose-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Live Listings ({listingsList.length})
        </button>

        <button
          onClick={() => setActiveTab('reservations')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'reservations' ? 'bg-rose-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Reservations ({reservationsList.length})
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'reports' ? 'bg-rose-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Reports Queue</span>
          {reportsList.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
              {reportsList.length}
            </span>
          )}
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold">Total Platform Users</span>
                <Users className="w-4 h-4 text-slate-500" />
              </div>
              <div className="text-3xl font-black text-slate-900">{stats?.total_users || 0}</div>
              <div className="text-[11px] text-slate-400">Buyers & Cooks combined</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold">Active Kitchens</span>
                <ChefHat className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-3xl font-black text-amber-600">{stats?.active_sellers || 0}</div>
              <div className="text-[11px] text-slate-400">Verified household cooks</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold">Live Food Listings</span>
                <ShoppingBag className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-3xl font-black text-emerald-700">{stats?.available_listings || 0}</div>
              <div className="text-[11px] text-slate-400">{stats?.ready_for_pickup || 0} ready right now</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold">Total Shared Volume</span>
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-3xl font-black text-blue-700">₹{stats?.total_gmv_rupees || 0}</div>
              <div className="text-[11px] text-slate-400">{stats?.completed_transactions || 0} completed orders</div>
            </div>
          </div>
        </div>
      )}

      {/* SELLERS TAB */}
      {activeTab === 'sellers' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Verified Household Cooks</h3>
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search cook or kitchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Cook Name</th>
                  <th className="py-3 px-4">Kitchen Name</th>
                  <th className="py-3 px-4">Email & Phone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sellers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">{s.full_name}</td>
                    <td className="py-3 px-4 text-slate-700">{s.kitchen_name || 'Home Kitchen'}</td>
                    <td className="py-3 px-4 text-slate-500">{s.email} • {s.phone || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          s.account_status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {s.account_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {s.account_status === 'active' ? (
                        <button
                          onClick={() => handleVerifySeller(s.id, 'suspended')}
                          disabled={actionInProgressId === s.id}
                          className="px-3 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold transition-colors cursor-pointer"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVerifySeller(s.id, 'approved')}
                          disabled={actionInProgressId === s.id}
                          className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold transition-colors cursor-pointer"
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LISTINGS TAB */}
      {activeTab === 'listings' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Active & Recent Food Listings</h3>
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search dishes or sellers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Dish</th>
                  <th className="py-3 px-4">Seller</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Portions</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Emergency Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredListings.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">{l.food_name}</td>
                    <td className="py-3 px-4 text-slate-700">{l.seller_name}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-800">₹{l.price}</td>
                    <td className="py-3 px-4 text-slate-600">{l.quantity_available || l.quantity}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                        {l.availability_status || l.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteListing(l.id)}
                        disabled={actionInProgressId === l.id}
                        className="px-3 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RESERVATIONS TAB */}
      {activeTab === 'reservations' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Platform Reservation Log</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Dish Name</th>
                  <th className="py-3 px-4">Buyer</th>
                  <th className="py-3 px-4">Portions</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reservationsList.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono text-slate-400">#{r.id.slice(0, 8)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{r.food_name || 'Homemade Meal'}</td>
                    <td className="py-3 px-4 text-slate-700">{r.buyer_name}</td>
                    <td className="py-3 px-4 font-bold">{r.quantity}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                        {r.reservation_status || r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORTS TAB */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Community Safety & Moderation Reports</h3>
          {reportsList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              ✓ No active community reports pending review.
            </div>
          ) : (
            <div className="space-y-3">
              {reportsList.map((rep) => (
                <div key={rep.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-700">Reason: {rep.reason}</span>
                    <span className="text-slate-400 text-[10px]">{rep.created_at}</span>
                  </div>
                  <div className="text-slate-600">Report ID: #{rep.id.slice(0, 8)} • Status: {rep.status}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
