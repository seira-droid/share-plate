import React, { useState, useEffect } from 'react';
import { User, AdminOverviewStats, ReportItem } from '../types';
import { api } from '../services/api';
import {
  Shield,
  Users,
  ChefHat,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  Clock,
  Sparkles,
  RefreshCw,
  Search,
  SlidersHorizontal,
  DollarSign
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User | null;
  onRefreshData?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onRefreshData }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sellers' | 'buyers' | 'listings' | 'reservations' | 'reports'>('overview');
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [listingsList, setListingsList] = useState<any[]>([]);
  const [reservationsList, setReservationsList] = useState<any[]>([]);
  const [reportsList, setReportsList] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Access check
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-rose-200 space-y-3">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center text-3xl">
          🚫
        </div>
        <h3 className="font-extrabold text-xl text-rose-900">Access Restricted</h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Administrative dashboard is restricted to authorized platform administrators only (HTTP 403 Forbidden).
        </p>
      </div>
    );
  }

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
    loadAdminData();
  }, []);

  const handleVerifySeller = async (sellerId: string, status: 'verified' | 'rejected') => {
    setActionInProgressId(sellerId);
    try {
      await api.verifySeller(sellerId, status, status === 'verified' ? 'active' : 'suspended');
      await loadAdminData();
      if (onRefreshData) onRefreshData();
    } catch (e: any) {
      alert(e.message || 'Failed to update seller verification status');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!window.confirm('Are you sure you want to delete this listing from the live map?')) {
      return;
    }
    setActionInProgressId(listingId);
    try {
      await api.removeListingByAdmin(listingId);
      await loadAdminData();
      if (onRefreshData) onRefreshData();
    } catch (e: any) {
      alert(e.message || 'Failed to remove listing');
    } finally {
      setActionInProgressId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white rounded-3xl shadow-xl border border-rose-900/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-rose-600 rounded-xl text-white">
              <Shield className="w-5 h-5" />
            </span>
            <h2 className="text-xl md:text-2xl font-black">Platform Administrator Command Center</h2>
          </div>
          <p className="text-slate-300 text-xs md:text-sm max-w-2xl">
            Live oversight of buyers, verified household sellers, active food listings on the 3D GPS map, and order transactions across Kerala.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAdminData}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl backdrop-blur-md transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Audit Feed</span>
          </button>
        </div>
      </div>

      {/* Admin KPI Overview Tiles */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Registered Users
            </span>
            <div className="text-2xl font-black text-slate-900">{stats.total_users}</div>
            <div className="text-[11px] text-slate-500 font-medium">
              {stats.active_buyers} buyers • {stats.active_sellers} sellers
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
              Dishes Ready (Live)
            </span>
            <div className="text-2xl font-black text-emerald-600">{stats.ready_for_pickup}</div>
            <div className="text-[11px] text-slate-500 font-medium">
              Of {stats.available_listings} total active
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
              Active Reservations
            </span>
            <div className="text-2xl font-black text-blue-600">{stats.active_reservations}</div>
            <div className="text-[11px] text-slate-500 font-medium">Locked for pickup</div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">
              Completed Orders
            </span>
            <div className="text-2xl font-black text-purple-600">{stats.completed_transactions}</div>
            <div className="text-[11px] text-slate-500 font-medium">Household meals shared</div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
              Gross Marketplace Val
            </span>
            <div className="text-2xl font-black text-amber-600">₹{stats.total_gmv_rupees.toFixed(0)}</div>
            <div className="text-[11px] text-slate-500 font-medium">Community economy</div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
              Reported Items
            </span>
            <div className="text-2xl font-black text-rose-600">{stats.reported_listings_count}</div>
            <div className="text-[11px] text-slate-500 font-medium">Moderation queue</div>
          </div>
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          📊 Live Platform Monitor
        </button>

        <button
          onClick={() => setActiveTab('sellers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'sellers'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          🍳 Sellers & Kitchens ({usersList.filter((u) => u.role === 'SELLER').length})
        </button>

        <button
          onClick={() => setActiveTab('buyers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'buyers'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          👥 Registered Buyers ({usersList.filter((u) => u.role === 'BUYER').length})
        </button>

        <button
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'listings'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          🍲 Food Listings Moderation ({listingsList.length})
        </button>

        <button
          onClick={() => setActiveTab('reservations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'reservations'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          📋 Reservations Audit ({reservationsList.length})
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'reports'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          🚨 Reports & Safety ({reportsList.length})
        </button>
      </div>

      {/* Tab: Overview / Live Monitor */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Live Food Listings Feed */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Live Food Availability across Kerala</span>
              </h3>
              <span className="text-xs text-slate-400 font-semibold">{listingsList.length} items</span>
            </div>

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {listingsList.slice(0, 8).map((listing) => (
                <div
                  key={listing.id}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={listing.image_url || listing.food_image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d'}
                      alt={listing.food_name}
                      className="w-11 h-11 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <div className="font-bold text-slate-900">{listing.food_name}</div>
                      <div className="text-slate-500 text-[11px]">
                        Seller: {listing.seller_name || 'Home Cook'} • {listing.house_label || 'House Kitchen'}
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-700">
                        ₹{listing.price} • {listing.quantity_available} left ({listing.portion_size || '1 portion'})
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        listing.availability_status === 'ready' || listing.status === 'ready'
                          ? 'bg-emerald-100 text-emerald-800'
                          : listing.availability_status === 'preparing' || listing.status === 'preparing'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {listing.availability_status || listing.status}
                    </span>
                    <button
                      onClick={() => handleDeleteListing(listing.id)}
                      className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Household Reservations Audit */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                <span>Recent Reservations & Transactions</span>
              </h3>
              <span className="text-xs text-slate-400 font-semibold">{reservationsList.length} orders</span>
            </div>

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {reservationsList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">No reservations logged yet.</div>
              ) : (
                reservationsList.slice(0, 8).map((res) => (
                  <div
                    key={res.id}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">
                        {res.listing?.food_name || 'Homemade Meal'} ({res.quantity}x)
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Buyer: <strong className="text-slate-700">{res.buyer_name}</strong> • Phone: {res.buyer_phone || 'N/A'}
                      </div>
                      <div className="text-slate-400 text-[10px]">
                        Created: {new Date(res.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-slate-900 text-sm">
                        ₹{(res.total_price || (res.listing?.price ? res.listing.price * res.quantity : 0)).toFixed(0)}
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        {res.status || res.reservation_status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Sellers Management & Approvals */}
      {activeTab === 'sellers' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Household Kitchen Sellers</h3>
              <p className="text-xs text-slate-500">
                Verify home kitchens, inspect GPS coordinates, and manage account statuses.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Seller Name</th>
                  <th className="py-3 px-3">Kitchen / House</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">GPS Location</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList
                  .filter((u) => u.role === 'SELLER')
                  .map((seller) => (
                    <tr key={seller.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-bold text-slate-900">{seller.full_name}</td>
                      <td className="py-3 px-3 text-slate-600">
                        <div className="font-semibold text-orange-900">{seller.kitchen_name || 'Home Kitchen'}</div>
                        <div className="text-[11px] text-slate-500">{seller.pickup_location || 'Residential address'}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <div>{seller.email}</div>
                        <div className="text-[11px] text-slate-400">{seller.phone || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                        {seller.latitude?.toFixed(4)}, {seller.longitude?.toFixed(4)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            seller.account_status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {seller.account_status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {seller.account_status !== 'active' ? (
                            <button
                              onClick={() => handleVerifySeller(seller.id, 'verified')}
                              disabled={actionInProgressId === seller.id}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px]"
                            >
                              Approve / Activate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleVerifySeller(seller.id, 'rejected')}
                              disabled={actionInProgressId === seller.id}
                              className="px-2.5 py-1 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 font-semibold rounded-lg text-[11px]"
                            >
                              Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Registered Buyers */}
      {activeTab === 'buyers' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Registered Neighborhood Buyers</h3>
            <p className="text-xs text-slate-500">
              Explore nearby buyers discovering homemade food in their vicinity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {usersList
              .filter((u) => u.role === 'BUYER')
              .map((buyer) => (
                <div key={buyer.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">👤 {buyer.full_name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                      Buyer
                    </span>
                  </div>
                  <div className="text-slate-600">
                    <div>📧 {buyer.email}</div>
                    <div>📞 {buyer.phone || '+91 98471 00000'}</div>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    📍 Lat: {buyer.latitude?.toFixed(4) || '9.9625'}, Lng: {buyer.longitude?.toFixed(4) || '76.2990'}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tab: Food Listings Moderation */}
      {activeTab === 'listings' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">All Platform Food Listings</h3>
            <p className="text-xs text-slate-500">
              Inspect all homemade dishes. Inappropriate or expired listings can be immediately deleted from the live map.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listingsList.map((listing) => (
              <div
                key={listing.id}
                className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between text-xs space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{listing.food_name}</h4>
                    <span className="font-black text-sm text-slate-900">₹{listing.price}</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    By <strong>{listing.seller_name}</strong> • {listing.house_label}
                  </p>
                  <p className="text-slate-600 text-[11px] mt-1.5 line-clamp-2">
                    {listing.description || 'Authentic homestyle dish prepared with care.'}
                  </p>
                  <div className="mt-2 text-[11px] text-slate-500">
                    Portion: <strong className="text-slate-700">{listing.portion_size}</strong> ({listing.quantity_available} left)
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      listing.status === 'ready'
                        ? 'bg-emerald-100 text-emerald-800'
                        : listing.status === 'preparing'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {listing.status}
                  </span>

                  <button
                    onClick={() => handleDeleteListing(listing.id)}
                    disabled={actionInProgressId === listing.id}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Listing</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Reservations Audit */}
      {activeTab === 'reservations' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Reservations & Community Transactions</h3>
            <p className="text-xs text-slate-500">
              Audit trail of neighbor-to-neighbor meal pickup requests and confirmations.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Reservation ID</th>
                  <th className="py-3 px-3">Meal</th>
                  <th className="py-3 px-3">Buyer</th>
                  <th className="py-3 px-3">Quantity</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reservationsList.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400">{res.id.slice(0, 8)}...</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{res.listing?.food_name || 'Homemade Meal'}</td>
                    <td className="py-3 px-3 text-slate-700">
                      <div>{res.buyer_name}</div>
                      <div className="text-[10px] text-slate-400">{res.buyer_phone || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-800 font-semibold">{res.quantity}x</td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      ₹{(res.total_price || (res.listing?.price ? res.listing.price * res.quantity : 0)).toFixed(0)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        {res.status || res.reservation_status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {new Date(res.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Reports & Moderation */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Community Safety & Reports</h3>
            <p className="text-xs text-slate-500">
              Buyer and seller safety notifications, quality feedback, and moderation requests.
            </p>
          </div>

          {reportsList.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <span>No active reports or flags. Community food sharing is running smoothly!</span>
            </div>
          ) : (
            <div className="space-y-3">
              {reportsList.map((rep) => (
                <div key={rep.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-rose-800">Report #{rep.id.slice(0, 6)}</span>
                    <p className="text-slate-700 mt-1">{rep.reason}</p>
                    <span className="text-[10px] text-slate-400">{new Date(rep.created_at).toLocaleString()}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    {rep.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

