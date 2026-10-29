import React, { useState, useEffect } from 'react';
import type { Listing, ListingStatus, GPSLocation } from '../types';
import { api } from '../services/api';
import { Plus, ChefHat, Sparkles, Navigation, X, Flame, Utensils, Home, Package } from 'lucide-react';

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
    dietary: 'Halal, Homemade Ghee',
    spice: 'Medium',
    meal_time: 'Lunch',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
    description: 'Slow-cooked authentic Kozhikode dum biryani with Kaima rice and secret home-pounded masala.'
  },
  {
    name: 'Kerala Porotta with Pepper Chicken Roast',
    category: 'Kerala Homestyle',
    portion_size: '3 Layered Porottas + 250ml Gravy',
    items_included: '3 flaky beaten porottas with slow-roasted pepper chicken gravy & shallots',
    price: 160,
    dietary: 'Non-Veg, Coconut Oil Cooked',
    spice: 'Spicy',
    meal_time: 'Dinner',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80',
    description: 'Crispy layered flaky parottas paired with spicy pepper chicken roast cooked in virgin coconut oil.'
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
    image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80',
    description: 'Homestyle vegetarian sadhya packed neatly with organic red rice, freshly grated coconut aviyal and payasam.'
  },
  {
    name: 'Paneer Butter Masala with 3 Butter Naan',
    category: 'North Indian Curries',
    portion_size: '3 Butter Naan + 350ml Paneer Gravy',
    items_included: '3 butter naans, rich cashew tomato makhani paneer gravy, pickled onions & green chutney',
    price: 180,
    dietary: '100% Pure Veg',
    spice: 'Medium',
    meal_time: 'Dinner',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80',
    description: 'Velvety makhani gravy with tender malai paneer cubes, prepared with fresh cream and kasuri methi.'
  },
  {
    name: 'Ghee Podi Masala Dosa & Medu Vada Combo',
    category: 'South Indian Tiffin',
    portion_size: '1 Large Dosa + 2 Medu Vadas',
    items_included: '1 crispy ghee roast dosa with potato masala, 2 medu vadas, drumstick sambar & 2 chutneys',
    price: 110,
    dietary: '100% Pure Veg',
    spice: 'Medium',
    meal_time: 'Breakfast',
    image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80',
    description: 'Freshly ground batter fermented for 14 hours, roasted golden in pure desi cow ghee.'
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
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
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

  // Form State: Household & Portion Customization
  const [houseLabel, setHouseLabel] = useState<string>('House #14B (Amma\'s Kitchen)');
  const [foodName, setFoodName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('Kerala Homestyle');
  const [portionSize, setPortionSize] = useState<string>('1 Full Meal Plate');
  const [itemsIncluded, setItemsIncluded] = useState<string>('Steamed Rice, Sambar, Cabbage Thoran, Aviyal, Pappadam');
  const [quantity, setQuantity] = useState<number>(4);
  const [price, setPrice] = useState<number>(140);
  const [spiceLevel, setSpiceLevel] = useState<string>('Medium');
  const [mealTime, setMealTime] = useState<string>('Lunch');
  const [foodImage, setFoodImage] = useState<string>(INDIAN_MENU_PRESETS[0].image);
  const [initialStatus, setInitialStatus] = useState<ListingStatus>('ready');
  const [pickupAddress, setPickupAddress] = useState<string>('House #14B, 2nd Cross, Indiranagar');
  const [approxLocation, setApproxLocation] = useState<string>('Indiranagar (~150m radius)');
  const [instructions, setInstructions] = useState<string>('Side door entrance. Ring calling bell. Please bring a cloth bag.');
  const [dietaryTags, setDietaryTags] = useState<string>('100% Pure Veg, Homemade Masala');

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

  const handleApplyPreset = (preset: typeof INDIAN_MENU_PRESETS[0]) => {
    setFoodName(preset.name);
    setCategory(preset.category);
    setPortionSize(preset.portion_size);
    setItemsIncluded(preset.items_included);
    setPrice(preset.price);
    setDietaryTags(preset.dietary);
    setSpiceLevel(preset.spice);
    setMealTime(preset.meal_time);
    setFoodImage(preset.image);
    setDescription(preset.description);
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim() || !pickupAddress.trim()) {
      alert('Please fill out Food Name and Pickup Address');
      return;
    }

    try {
      await api.createListing({
        food_name: foodName.trim(),
        description: description.trim(),
        category,
        house_label: houseLabel.trim(),
        portion_size: portionSize.trim(),
        items_included: itemsIncluded.trim(),
        spice_level: spiceLevel,
        meal_time: mealTime,
        quantity_available: Number(quantity),
        price: Number(price),
        currency: '₹',
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
      await loadListings();
      if (onRefreshListings) onRefreshListings();
    } catch (err: any) {
      alert(err.message || 'Failed to publish food listing');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-orange-600 via-amber-600 to-emerald-700 text-white rounded-3xl shadow-xl shadow-orange-950/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
              <ChefHat className="w-5 h-5 text-white" />
            </span>
            <h2 className="text-xl md:text-2xl font-black">Household Kitchen Manager</h2>
          </div>
          <p className="text-orange-100 text-xs md:text-sm max-w-xl">
            List fresh homemade Indian food prepared at your house today. Set portions, meal timing, and items included. Click <span className="font-bold underline">"FOOD IS READY"</span> to instantly broadcast to nearby buyers!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-white text-orange-900 hover:bg-orange-50 font-bold text-sm rounded-2xl shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>List Dish Prepared Today</span>
          </button>
        </div>
      </div>

      {/* GPS Location Status Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <Home className="w-4 h-4 text-orange-600 flex-shrink-0" />
          <span>
            <strong className="font-semibold text-slate-900">Household GPS Pin:</strong>{' '}
            {sellerGPS.lat.toFixed(5)}, {sellerGPS.lng.toFixed(5)} ({sellerGPS.addressName || 'Current House Location'})
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
            🔒 House door address stays private until neighbor confirms reservation.
          </span>
        </div>
      </div>

      {/* Listings Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <span>Dishes Cooked at Your House</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">
              {myListings.length} dishes
            </span>
          </h3>
          <button
            onClick={loadListings}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 underline"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading your household dishes...</div>
        ) : myListings.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
            <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-600 mx-auto flex items-center justify-center text-3xl">
              🥘
            </div>
            <h4 className="font-bold text-slate-800">No dishes listed right now</h4>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              Prepared an extra pot of Biryani, Curries, or Dosa batter? List what's in your kitchen and let nearby neighbors discover it.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white font-bold text-xs rounded-xl hover:bg-orange-700 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Add Food Prepared Today
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
                    {/* Header Image */}
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
                      
                      {/* Price Tag in ₹ */}
                      <div className="absolute top-3 right-3 bg-slate-900/85 backdrop-blur-md text-white font-black text-sm px-3 py-1 rounded-full">
                        ₹{listing.price.toFixed(0)}
                      </div>

                      {/* Status Tag */}
                      <div className="absolute bottom-3 left-3">
                        {listing.status === 'ready' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-md flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                            FOOD IS READY
                          </span>
                        )}
                        {listing.status === 'preparing' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-md">
                            🍳 Cooking in Progress
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
                        <span className="font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md">
                          {listing.category}
                        </span>
                        <span className="font-semibold text-emerald-700">
                          {listing.quantity_available} {listing.quantity_available === 1 ? 'portion' : 'portions'} left
                        </span>
                      </div>

                      {/* House Label */}
                      {listing.house_label && (
                        <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                          <Home className="w-3.5 h-3.5 text-orange-600" />
                          <span>{listing.house_label}</span>
                        </div>
                      )}

                      <h4 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">
                        {listing.food_name}
                      </h4>

                      {/* Portion Specifications */}
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="font-semibold flex items-center gap-1">
                            <Package className="w-3 h-3 text-emerald-600" /> Portion:
                          </span>
                          <span className="font-bold text-slate-900">{listing.portion_size || '1 Full Plate'}</span>
                        </div>
                        {listing.items_included && (
                          <div className="text-[11px] text-slate-600 leading-tight">
                            <strong className="text-slate-700">Includes:</strong> {listing.items_included}
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-1 text-[11px]">
                          {listing.spice_level && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-medium">
                              🌶️ {listing.spice_level}
                            </span>
                          )}
                          {listing.meal_time && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                              ⏰ {listing.meal_time}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-1 text-[11px] text-slate-500 space-y-0.5">
                        <div>
                          <strong className="text-slate-700">Pickup Address:</strong> {listing.pickup_address}
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
                      Update Live Status:
                    </div>

                    {/* PROMINENT "FOOD IS READY" BUTTON */}
                    {listing.status !== 'ready' && (
                      <button
                        onClick={() => handleStatusChange(listing.id, 'ready')}
                        disabled={isActionLoading}
                        className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-98"
                      >
                        <Sparkles className="w-4 h-4 text-emerald-200" />
                        <span>FOOD IS READY! (Broadcast on Live Map)</span>
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
                        Cooking
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

      {/* Customizable Food Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-5 bg-gradient-to-r from-orange-600 via-amber-600 to-emerald-700 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5" />
                <h3 className="font-bold text-lg">List Food Prepared at Your House</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="p-6 overflow-y-auto space-y-4">
              {/* Quick Preset Autocomplete Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ✨ Quick-Fill Indian Homestyle Presets (Optional)
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {INDIAN_MENU_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 whitespace-nowrap transition-colors"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Household Identification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-orange-50/60 rounded-2xl border border-orange-100">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    House / Kitchen Label *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. House #14B (Amma's Kitchen)"
                    value={houseLabel}
                    onChange={(e) => setHouseLabel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Meal Timing
                  </label>
                  <select
                    value={mealTime}
                    onChange={(e) => setMealTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Breakfast">Breakfast (Morning Tiffin)</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Evening Snacks">Evening Snacks & Chai</option>
                    <option value="Dinner">Dinner</option>
                  </select>
                </div>
              </div>

              {/* Food Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Food / Dish Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kozhikode Chicken Biryani / Porotta & Curry"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Regional Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    <option value="Kerala Homestyle">Kerala Homestyle</option>
                    <option value="Biryani & Rice">Biryani & Rice</option>
                    <option value="Traditional Thali">Traditional Thali / Sadhya</option>
                    <option value="North Indian Curries">North Indian Curries & Roti</option>
                    <option value="South Indian Tiffin">South Indian Tiffin (Dosa/Idli)</option>
                    <option value="Evening Snacks & Chaat">Evening Snacks & Chaat</option>
                    <option value="Sweets & Desserts">Sweets & Desserts</option>
                  </select>
                </div>
              </div>

              {/* Portion Customization Section */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>Portion & Serving Customization</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Total Portions Prepared *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Serving Unit / Measure *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1 Full Thali / 3 Porottas"
                      value={portionSize}
                      onChange={(e) => setPortionSize(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Price per Portion (₹) *
                    </label>
                    <input
                      type="number"
                      step="5"
                      min="10"
                      required
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    What is Included in 1 Portion?
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3 Rotis, Paneer Butter Masala, Sambar, Raitha, Pickle & Sweet"
                    value={itemsIncluded}
                    onChange={(e) => setItemsIncluded(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Spice Level
                    </label>
                    <select
                      value={spiceLevel}
                      onChange={(e) => setSpiceLevel(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
                    >
                      <option value="Mild">Mild (Kids Friendly)</option>
                      <option value="Medium">Medium (Balanced)</option>
                      <option value="Spicy">Spicy (Hot & Flavorful)</option>
                      <option value="Extra Spicy">Extra Spicy (Kerala Pepper Special)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Availability Status
                    </label>
                    <select
                      value={initialStatus}
                      onChange={(e) => setInitialStatus(e.target.value as ListingStatus)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
                    >
                      <option value="ready">Ready for Pickup (Live Immediately)</option>
                      <option value="preparing">Currently Cooking (Ready Soon)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Preparation Notes & Cooking Style
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Prepared with cold-pressed coconut oil, no MSG or artificial coloring. Packed in insulated containers."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Photo Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Food Photo</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {INDIAN_MENU_PRESETS.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFoodImage(p.image)}
                      className={`relative h-14 rounded-xl overflow-hidden border-2 transition-transform ${
                        foodImage === p.image ? 'border-orange-600 scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Residential Pickup & Privacy */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Home className="w-4 h-4 text-orange-600" />
                  <span>Household Address & Privacy Protection</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Exact Door / House Address (Protected until reservation) *
                    </label>
                    <input
                      type="text"
                      required
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Public Neighborhood Label (Displayed on Map)
                    </label>
                    <input
                      type="text"
                      value={approxLocation}
                      onChange={(e) => setApproxLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Pickup Instructions (Gate buzzer, container preference, timing)
                  </label>
                  <input
                    type="text"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-orange-600/20 transition-all active:scale-98"
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
