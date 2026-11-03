import React, { useState, useEffect } from 'react';
import type { Listing, ListingStatus, GPSLocation } from '../types';
import { api } from '../services/api';
import {
  Plus,
  ChefHat,
  Sparkles,
  Navigation,
  X,
  Flame,
  Utensils,
  Home,
  Package,
  Clock,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Phone,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  BookmarkCheck
} from 'lucide-react';

interface SellerDashboardProps {
  currentUserId: string;
  sellerGPS: GPSLocation;
  onRefreshListings?: () => void;
  onRequestGPS?: () => void;
}

const INDIAN_MENU_PRESETS = [
  {
    name: 'Malabar Chicken Dum Biryani',
    category: 'Biryani & Rice',
    portion_size: '1 Clay Pot Box (Feeds 1-2)',
    items_included: 'Kaima rice biryani with 2 chicken pieces, boiled egg, onion raitha & date pickle',
    price: 190,
    dietary: 'Halal, Homemade Desi Ghee',
    spice: 'Medium',
    meal_time: 'Lunch',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    description: 'Slow-cooked authentic Kozhikode dum biryani with Kaima rice and secret home-pounded spices.'
  },
  {
    name: 'Kerala Porotta with Pepper Chicken Roast',
    category: 'Kerala Homestyle',
    portion_size: '3 Layered Porottas + 250ml Curry',
    items_included: '3 flaky beaten porottas with slow-roasted pepper chicken gravy & shallots',
    price: 160,
    dietary: 'Non-Veg, Coconut Oil Cooked',
    spice: 'Spicy',
    meal_time: 'Dinner',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
    description: 'Crispy layered flaky parottas paired with spicy pepper chicken roast cooked in pure virgin coconut oil.'
  },
  {
    name: 'Traditional Kerala Sadhya Lunch Pack',
    category: 'Traditional Thali',
    portion_size: '1 Complete Sadhya Meal Box',
    items_included: 'Red Matta rice, Sambar, Aviyal, Thoran, Pulissery, Inji Puli, Pappadam & Payasam',
    price: 140,
    dietary: '100% Pure Veg',
    spice: 'Mild',
    meal_time: 'Lunch',
    image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80',
    description: 'Homestyle vegetarian sadhya packed neatly with organic red rice, freshly grated coconut aviyal and warm payasam.'
  },
  {
    name: 'Paneer Butter Masala with 3 Butter Naan',
    category: 'North Indian Curries',
    portion_size: '3 Butter Naan + 350ml Gravy',
    items_included: '3 butter naans, rich cashew tomato makhani paneer gravy, pickled onions & green chutney',
    price: 180,
    dietary: '100% Pure Veg',
    spice: 'Medium',
    meal_time: 'Dinner',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80',
    description: 'Velvety makhani gravy with tender malai paneer cubes, prepared with fresh cream and kasuri methi.'
  },
  {
    name: 'Ghee Podi Masala Dosa & Medu Vada',
    category: 'South Indian Tiffin',
    portion_size: '1 Large Dosa + 2 Medu Vadas',
    items_included: '1 crispy ghee roast dosa with potato masala, 2 medu vadas, drumstick sambar & 2 chutneys',
    price: 110,
    dietary: '100% Pure Veg',
    spice: 'Medium',
    meal_time: 'Breakfast',
    image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80',
    description: 'Freshly ground batter fermented for 14 hours, roasted golden in pure desi cow ghee with medu vadas.'
  },
  {
    name: 'Crispy Punjabi Samosas (Plate of 4)',
    category: 'Evening Snacks & Chaat',
    portion_size: '4 Samosas + 2 Chutney Cups',
    items_included: '4 crispy ajwain samosas stuffed with spiced potatoes & peas, mint & tamarind chutneys',
    price: 80,
    dietary: '100% Pure Veg',
    spice: 'Spicy',
    meal_time: 'Evening Snacks',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
    description: 'Hot out of the kadai! Flaky ajwain pastry stuffed with crushed coriander, cashew and spiced potatoes.'
  }
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
  const [houseLabel, setHouseLabel] = useState<string>('House #14B (Amma\'s Kitchen)');
  const [foodName, setFoodName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('Kerala Homestyle');
  const [portionSize, setPortionSize] = useState<string>('1 Full Plate (Feeds 1)');
  const [itemsIncluded, setItemsIncluded] = useState<string>('');
  const [spiceLevel, setSpiceLevel] = useState<string>('Medium');
  const [mealTime, setMealTime] = useState<string>('Lunch');
  const [quantity, setQuantity] = useState<number>(4);
  const [price, setPrice] = useState<number>(120);
  const [imageUrl, setImageUrl] = useState<string>(
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
  );
  const [pickupAddress, setPickupAddress] = useState<string>(
    '14B, Panampilly Nagar Main Road, Kochi'
  );
  const [pickupInstructions, setPickupInstructions] = useState<string>(
    'Side gate entrance. Press buzzer 14B. Meals packed in thermal bags.'
  );

  const fetchMyListings = async () => {
    setLoading(true);
    try {
      const data = await api.getMyListings(currentUserId);
      setMyListings(data);
    } catch (err) {
      console.error('Failed to fetch seller listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyListings();
  }, [currentUserId]);

  // Apply a preset recipe
  const handleApplyPreset = (preset: typeof INDIAN_MENU_PRESETS[0]) => {
    setFoodName(preset.name);
    setCategory(preset.category);
    setPortionSize(preset.portion_size);
    setItemsIncluded(preset.items_included);
    setPrice(preset.price);
    setSpiceLevel(preset.spice);
    setMealTime(preset.meal_time);
    setImageUrl(preset.image);
    setDescription(preset.description);
  };

  // 1-Click "MARK FOOD AS READY"
  const handleMarkReady = async (listingId: string) => {
    setActionLoadingId(listingId);
    try {
      await api.updateListingStatus(listingId, 'ready');
      await fetchMyListings();
      if (onRefreshListings) onRefreshListings();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Mark Sold Out
  const handleMarkSoldOut = async (listingId: string) => {
    setActionLoadingId(listingId);
    try {
      await api.updateListingStatus(listingId, 'sold_out');
      await fetchMyListings();
      if (onRefreshListings) onRefreshListings();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Create Listing
  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim()) {
      alert('Please enter a dish name');
      return;
    }

    try {
      await api.createListing({
        food_name: foodName,
        description,
        category,
        quantity,
        quantity_available: quantity,
        price,
        currency: '₹',
        image_url: imageUrl,
        status: 'preparing',
        house_label: houseLabel,
        portion_size: portionSize,
        items_included: itemsIncluded,
        spice_level: spiceLevel,
        meal_time: mealTime,
        latitude: sellerGPS.lat,
        longitude: sellerGPS.lng,
        pickup_address: pickupAddress,
        approx_location_name: sellerGPS.addressName || 'Kochi Neighborhood',
        pickup_instructions: pickupInstructions
      });

      setShowCreateModal(false);
      await fetchMyListings();
      if (onRefreshListings) onRefreshListings();
    } catch (err: any) {
      alert(err.message || 'Failed to create food listing');
    }
  };

  // Metrics
  const preparingCount = myListings.filter((l) => l.status === 'preparing').length;
  const readyCount = myListings.filter((l) => l.status === 'ready').length;
  const totalPortions = myListings.reduce((sum, l) => sum + (l.quantity_available || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Kitchen Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-white/20 rounded-2xl">👩‍🍳</span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
              Verified Home Kitchen
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Household Kitchen Dashboard
          </h2>
          <p className="text-amber-100 text-xs sm:text-sm max-w-xl">
            Manage your home-cooked meal portions. When your food is hot off the stove, tap "Mark Food As Ready" to broadcast to nearby hungry neighbors.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3.5 bg-white text-amber-950 hover:bg-amber-50 font-extrabold text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-5 h-5 text-amber-600" />
          <span>Add New Dish</span>
        </button>
      </div>

      {/* Kitchen KPI Quick Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">Cooking Now</div>
          <div className="text-2xl font-black text-amber-600 flex items-center gap-1.5">
            <Flame className="w-5 h-5 text-amber-500" />
            <span>{preparingCount}</span>
          </div>
          <div className="text-[11px] text-slate-400">Meals in preparation</div>
        </div>

        <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">Ready for Pickup</div>
          <div className="text-2xl font-black text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{readyCount}</span>
          </div>
          <div className="text-[11px] text-slate-400">Live on neighbors' map</div>
        </div>

        <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">Available Portions</div>
          <div className="text-2xl font-black text-slate-900 flex items-center gap-1.5">
            <Package className="w-5 h-5 text-slate-700" />
            <span>{totalPortions}</span>
          </div>
          <div className="text-[11px] text-slate-400">Total portions available</div>
        </div>

        <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">Kitchen GPS Area</div>
          <div className="text-base font-bold text-slate-800 truncate">
            📍 {sellerGPS.addressName || 'Kochi'}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold">Privacy Shield Active</div>
        </div>
      </div>

      {/* My Active Dishes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Today's Kitchen Menu</h3>
          <button
            onClick={fetchMyListings}
            disabled={loading}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {myListings.length === 0 && !loading && (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-700 mx-auto flex items-center justify-center text-3xl">
              🍳
            </div>
            <h4 className="font-bold text-slate-900 text-lg">No dishes listed right now</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              What are you cooking today? Share a few extra portions with your neighbors in 2 minutes!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>List Today's Dish</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myListings.map((listing) => {
            const isReady = listing.status === 'ready';
            const isCooking = listing.status === 'preparing';
            const isSoldOut = listing.status === 'sold_out';

            return (
              <div
                key={listing.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4 text-left"
              >
                <div className="flex gap-4">
                  <img
                    src={
                      listing.image_url ||
                      listing.food_image ||
                      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
                    }
                    alt={listing.food_name}
                    className="w-24 h-24 rounded-2xl object-cover flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                        {listing.category}
                      </span>
                      <span className="text-base font-black text-slate-900">
                        ₹{listing.price}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-base truncate">
                      {listing.food_name}
                    </h4>

                    <div className="text-xs text-slate-500 mt-0.5">
                      {listing.portion_size || '1 Full Plate'} • {listing.meal_time}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      {isReady ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          Ready for Pickup (Live on Map)
                        </span>
                      ) : isCooking ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Cooking in Kitchen
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                          Sold Out
                        </span>
                      )}

                      <span className="text-xs text-slate-600 font-semibold">
                        {listing.quantity_available} left
                      </span>
                    </div>
                  </div>
                </div>

                {/* PROMINENT ACTION: MARK FOOD AS READY BUTTON */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
                  {isCooking && (
                    <button
                      onClick={() => handleMarkReady(listing.id)}
                      disabled={actionLoadingId === listing.id}
                      className="w-full sm:flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs shadow-md shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                    >
                      <Flame className="w-4 h-4 text-amber-300" />
                      <span>{actionLoadingId === listing.id ? 'Broadcasting...' : 'MARK FOOD AS READY'}</span>
                    </button>
                  )}

                  {isReady && (
                    <div className="w-full sm:flex-1 p-2 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold text-center">
                      ✓ Dish is Broadcasting Live to Buyers!
                    </div>
                  )}

                  {!isSoldOut && (
                    <button
                      onClick={() => handleMarkSoldOut(listing.id)}
                      disabled={actionLoadingId === listing.id}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Mark Sold Out
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CREATE FOOD LISTING MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto relative animate-scaleUp text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">List Fresh Homemade Meal</h3>
              <p className="text-xs text-slate-500">
                Pick a popular Indian preset below or fill out your custom dish details.
              </p>
            </div>

            {/* Quick Recipe Presets Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Quick 1-Click Kerala Presets:
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {INDIAN_MENU_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="p-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-left text-xs whitespace-nowrap flex-shrink-0 cursor-pointer transition-colors"
                  >
                    <div className="font-bold text-amber-950">{p.name}</div>
                    <div className="text-[10px] text-amber-700 font-semibold">₹{p.price} • {p.meal_time}</div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kerala Porotta with Chicken Roast"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                  >
                    <option value="Kerala Homestyle">Kerala Homestyle</option>
                    <option value="Biryani & Rice">Biryani & Rice</option>
                    <option value="Traditional Thali">Traditional Thali</option>
                    <option value="South Indian Tiffin">South Indian Tiffin</option>
                    <option value="North Indian Curries">North Indian Curries</option>
                    <option value="Evening Snacks & Chaat">Evening Snacks & Chaat</option>
                    <option value="Sweets & Desserts">Sweets & Desserts</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Meal Type</label>
                  <select
                    value={mealTime}
                    onChange={(e) => setMealTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Evening Snacks">Evening Snacks</option>
                    <option value="Dinner">Dinner</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Portions Available *</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Portion Description</label>
                <input
                  type="text"
                  placeholder="e.g. 1 Clay Pot Box (Feeds 1-2) or 3 Porottas + Gravy"
                  value={portionSize}
                  onChange={(e) => setPortionSize(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Private Door Address (Unlocked on reservation only) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 304, Palm Grove Apartments, Panampilly Nagar"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Pickup Instructions for Buyer</label>
                <input
                  type="text"
                  placeholder="e.g. Ring buzzer 304. Please bring your own tiffin carrier if possible."
                  value={pickupInstructions}
                  onChange={(e) => setPickupInstructions(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Publish to Today's Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
