import React, { useState, useEffect } from 'react';
import { Listing, ListingStatus, GPSLocation } from '../types';
import { api } from '../services/api';
import { Plus, ChefHat, CheckCircle2, Clock, AlertCircle, MapPin, Sparkles, Navigation, X } from 'lucide-react';

interface SellerDashboardProps {
  currentUserId: string;
  sellerGPS: GPSLocation;
  onRefreshListings?: () => void;
  onRequestGPS?: () => void;
}

const PRESET_FOOD_IMAGES = [
  { name: 'Nonna Lasagna', url: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=600&q=80' },
  { name: 'Sourdough Bread', url: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=600&q=80' },
  { name: 'Chicken Biryani', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80' },
  { name: 'Warm Cookies', url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80' },
  { name: 'Buddha Bowl', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80' },
  { name: 'Thai Coconut Curry', url: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=600&q=80' },
];

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  currentUserId,
  sellerGPS,
  onRefreshListings,
  onRequestGPS
}) => {
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Form State
  const [foodName, setFoodName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('Home Meals');
  const [quantity, setQuantity] = useState<number>(3);
  const [price, setPrice] = useState<number>(6.50);
  const [foodImage, setFoodImage] = useState<string>(PRESET_FOOD_IMAGES[0].url);
  const [initialStatus, setInitialStatus] = useState<ListingStatus>('preparing');
  const [pickupAddress, setPickupAddress] = useState<string>('Apt 3B, 45 Maple Avenue');
  const [approxLocation, setApproxLocation] = useState<string>('Maple Heights (~150m radius)');
  const [instructions, setInstructions] = useState<string>('Please ring bell 3B. Bring a container.');
  const [dietaryTags, setDietaryTags] = useState<string>('Vegetarian, Freshly Made');

  const loadListings = async () => {
    try {
      const data = await api.getMyListings(currentUserId);
      setMyListings(data);
    } catch (e) {
      console.error('Failed to load seller listings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, [currentUserId]);

  const handleStatusChange = async (listingId: string, newStatus: ListingStatus) => {
    setActionLoadingId(listingId);
    try {
      await api.updateListingStatus(listingId, newStatus, currentUserId);
      await loadListings();
      if (onRefreshListings) onRefreshListings();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim() || !pickupAddress.trim()) {
      alert('Please fill out all required fields');
      return;
    }

    try {
      await api.createListing({
        food_name: foodName.trim(),
        description: description.trim(),
        category,
        quantity_available: Number(quantity),
        price: Number(price),
        food_image: foodImage,
        status: initialStatus,
        latitude: sellerGPS.lat,
        longitude: sellerGPS.lng,
        pickup_address: pickupAddress.trim(),
        approx_location_name: approxLocation.trim(),
        pickup_instructions: instructions.trim(),
        dietary_tags: dietaryTags.trim()
      }, currentUserId);

      setShowCreateModal(false);
      resetForm();
      await loadListings();
      if (onRefreshListings) onRefreshListings();
    } catch (err: any) {
      alert(err.message || 'Failed to publish food listing');
    }
  };

  const resetForm = () => {
    setFoodName('');
    setDescription('');
    setCategory('Home Meals');
    setQuantity(3);
    setPrice(6.50);
    setFoodImage(PRESET_FOOD_IMAGES[0].url);
    setInitialStatus('preparing');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl shadow-xl shadow-emerald-700/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
              <ChefHat className="w-5 h-5 text-white" />
            </span>
            <h2 className="text-xl md:text-2xl font-black">Household Kitchen Manager</h2>
          </div>
          <p className="text-emerald-100 text-xs md:text-sm max-w-xl">
            List your surplus home-cooked meals. When your dish is cooked, hit <span className="font-bold underline">"Food is Ready"</span> to instantly broadcast your availability on nearby buyers' live GPS maps!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-sm rounded-2xl shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>List New Food</span>
          </button>
        </div>
      </div>

      {/* GPS Location Status Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>
            <strong className="font-semibold text-slate-900">Pickup GPS Pin:</strong>{' '}
            {sellerGPS.lat.toFixed(5)}, {sellerGPS.lng.toFixed(5)} ({sellerGPS.addressName || 'Current House Coordinates'})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onRequestGPS && (
            <button
              onClick={onRequestGPS}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-500" />
              <span>Update GPS Pin</span>
            </button>
          )}
          <span className="text-[11px] text-slate-500">
            🔒 Exact coordinates masked from public map until reservation.
          </span>
        </div>
      </div>

      {/* Listings Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <span>Your Listed Dishes</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">
              {myListings.length}
            </span>
          </h3>
          <button
            onClick={loadListings}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading your kitchen listings...</div>
        ) : myListings.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center text-3xl">
              🍳
            </div>
            <h4 className="font-bold text-slate-800">No food listings yet</h4>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              Ready to share surplus meals with your neighbors? Click "List New Food" to put your dish on the live map.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Add Food Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {myListings.map((listing) => {
              const isActionLoading = actionLoadingId === listing.id;
              return (
                <div
                  key={listing.id}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {/* Food Photo Header */}
                    <div className="relative h-44 w-full bg-slate-100">
                      {listing.food_image ? (
                        <img
                          src={listing.food_image}
                          alt={listing.food_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🍲</div>
                      )}
                      
                      {/* Price Tag */}
                      <div className="absolute top-3 right-3 bg-slate-900/85 backdrop-blur-md text-white font-black text-sm px-3 py-1 rounded-full">
                        ${listing.price.toFixed(2)}
                      </div>

                      {/* Current Status Pill */}
                      <div className="absolute bottom-3 left-3">
                        {listing.status === 'ready' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-md flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                            FOOD IS READY
                          </span>
                        )}
                        {listing.status === 'preparing' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-md">
                            🍳 Preparing
                          </span>
                        )}
                        {listing.status === 'reserved' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-600 text-white shadow-md">
                            🏷️ Reserved
                          </span>
                        )}
                        {listing.status === 'sold_out' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-500 text-white shadow-md">
                            Sold Out
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {listing.category}
                        </span>
                        <span>{listing.quantity_available} portions remaining</span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">
                        {listing.food_name}
                      </h4>

                      {listing.description && (
                        <p className="text-xs text-slate-600 line-clamp-2">{listing.description}</p>
                      )}

                      <div className="pt-2 text-[11px] text-slate-500 space-y-1">
                        <div>
                          <span className="font-medium text-slate-700">Pickup Address:</span> {listing.pickup_address}
                        </div>
                        {listing.time_since_ready && (
                          <div className="text-emerald-600 font-medium">
                            ⏱️ Marked Ready {listing.time_since_ready}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Seller Status Controls */}
                  <div className="p-4 bg-slate-50/80 border-t border-slate-100 space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Update Live Availability:
                    </div>

                    {/* PROMINENT "FOOD IS READY" BUTTON */}
                    {listing.status !== 'ready' && (
                      <button
                        onClick={() => handleStatusChange(listing.id, 'ready')}
                        disabled={isActionLoading}
                        className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-98"
                      >
                        <Sparkles className="w-4 h-4 text-emerald-200" />
                        <span>FOOD IS READY! (Publish to Live Map)</span>
                      </button>
                    )}

                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      <button
                        onClick={() => handleStatusChange(listing.id, 'preparing')}
                        disabled={isActionLoading || listing.status === 'preparing'}
                        className={`py-1.5 px-2 rounded-lg font-semibold border transition-colors ${
                          listing.status === 'preparing'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        Preparing
                      </button>

                      <button
                        onClick={() => handleStatusChange(listing.id, 'reserved')}
                        disabled={isActionLoading || listing.status === 'reserved'}
                        className={`py-1.5 px-2 rounded-lg font-semibold border transition-colors ${
                          listing.status === 'reserved'
                            ? 'bg-sky-100 text-sky-800 border-sky-300'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        Reserved
                      </button>

                      <button
                        onClick={() => handleStatusChange(listing.id, 'sold_out')}
                        disabled={isActionLoading || listing.status === 'sold_out'}
                        className={`py-1.5 px-2 rounded-lg font-semibold border transition-colors ${
                          listing.status === 'sold_out'
                            ? 'bg-slate-300 text-slate-800 border-slate-400'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        Sold Out
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Listing Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5" />
                <h3 className="font-bold text-lg">List Food on Live GPS Map</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Food Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Homemade Lasagna Bolognese"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Home Meals">Home Meals</option>
                    <option value="Bakery & Breads">Bakery & Breads</option>
                    <option value="Curries & Rice">Curries & Rice</option>
                    <option value="Desserts & Snacks">Desserts & Snacks</option>
                    <option value="Healthy & Salads">Healthy & Salads</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Status</label>
                  <select
                    value={initialStatus}
                    onChange={(e) => setInitialStatus(e.target.value as ListingStatus)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="ready">Ready for Pickup (Live Immediately)</option>
                    <option value="preparing">Preparing (Cooking Now)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantity (Portions)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Price per portion ($)</label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Ingredients, preparation style, and notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Photo Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Food Photo Preset</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESET_FOOD_IMAGES.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFoodImage(img.url)}
                      className={`relative h-14 rounded-xl overflow-hidden border-2 transition-transform ${
                        foodImage === img.url ? 'border-emerald-600 scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Exact Residential Address (Privacy Protected) */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Residential Location & Privacy</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Exact Pickup Address (Revealed upon reservation) *
                    </label>
                    <input
                      type="text"
                      required
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Public Neighborhood Label (Visible to all)
                    </label>
                    <input
                      type="text"
                      value={approxLocation}
                      onChange={(e) => setApproxLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Pickup Instructions (Door code, buzzer, containers)
                  </label>
                  <input
                    type="text"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/20 transition-all active:scale-98"
                >
                  Publish Food to Live GPS Map
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
