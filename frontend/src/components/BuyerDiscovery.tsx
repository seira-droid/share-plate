import React, { useState } from 'react';
import { Listing, GPSLocation } from '../types';
import { BuyerMap } from './BuyerMap';
import { Search, MapPin, SlidersHorizontal, Clock, ChefHat, Sparkles, AlertCircle, BookmarkCheck } from 'lucide-react';

interface BuyerDiscoveryProps {
  buyerLocation: GPSLocation;
  listings: Listing[];
  radiusKm: number;
  onRadiusChange: (radius: number) => void;
  categoryFilter: string;
  onCategoryChange: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  selectedListing: Listing | null;
  onSelectListing: (listing: Listing) => void;
  onQuickReserve: (listing: Listing) => void;
  onMapClickLocation?: (lat: number, lng: number) => void;
  isLoading?: boolean;
}

const CATEGORIES = [
  'All',
  'Home Meals',
  'Bakery & Breads',
  'Curries & Rice',
  'Desserts & Snacks',
  'Healthy & Salads'
];

const RADIUS_OPTIONS = [1, 3, 5, 10];

export const BuyerDiscovery: React.FC<BuyerDiscoveryProps> = ({
  buyerLocation,
  listings,
  radiusKm,
  onRadiusChange,
  categoryFilter,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  selectedListing,
  onSelectListing,
  onQuickReserve,
  onMapClickLocation,
  isLoading = false
}) => {
  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('map');

  return (
    <div className="space-y-4">
      {/* Top Search & Filter Bar */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search homemade dishes, chefs, or ingredients..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>

          {/* Distance Filter Pills */}
          <div className="flex items-center gap-1.5 self-start md:self-auto overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Radius:
            </span>
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => onRadiusChange(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  radiusKm === r
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 self-start md:self-auto">
            <button
              onClick={() => onStatusChange(statusFilter === 'ready' ? 'all' : 'ready')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                statusFilter === 'ready'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${statusFilter === 'ready' ? 'bg-white' : 'bg-emerald-500'}`}></span>
              Ready Now Only
            </button>
          </div>
        </div>

        {/* Category Horizontal Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Map / List View Toggle */}
      <div className="flex lg:hidden bg-slate-200 p-1 rounded-2xl">
        <button
          onClick={() => setMobileTab('map')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            mobileTab === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          🗺️ Live GPS Map
        </button>
        <button
          onClick={() => setMobileTab('list')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            mobileTab === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          🍲 Food List ({listings.length})
        </button>
      </div>

      {/* Main Content Area: Split View for Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Interactive Live Map (Columns 7) */}
        <div
          className={`lg:col-span-7 h-[580px] rounded-3xl overflow-hidden shadow-sm ${
            mobileTab === 'list' ? 'hidden lg:block' : 'block'
          }`}
        >
          <BuyerMap
            buyerLocation={buyerLocation}
            listings={listings}
            radiusKm={radiusKm}
            selectedListing={selectedListing}
            onSelectListing={onSelectListing}
            onQuickReserve={onQuickReserve}
            onMapClickLocation={onMapClickLocation}
          />
        </div>

        {/* Food Listings Feed (Columns 5) */}
        <div
          className={`lg:col-span-5 space-y-3 max-h-[580px] overflow-y-auto pr-1 ${
            mobileTab === 'map' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="flex items-center justify-between pb-1">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>Nearby Fresh Food</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                {listings.length} available
              </span>
            </h3>
            <span className="text-xs text-slate-400">Nearest first</span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Scanning neighborhood kitchens...</div>
          ) : listings.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-2">
              <div className="text-3xl">🔍</div>
              <h4 className="font-bold text-slate-700 text-sm">No food within {radiusKm} km</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Try widening your distance filter to 5 or 10 km, or check back soon as nearby neighbors mark their meals ready!
              </p>
              <button
                onClick={() => onRadiusChange(10)}
                className="mt-2 px-3 py-1.5 bg-blue-50 text-blue-600 font-bold text-xs rounded-xl hover:bg-blue-100 transition-colors"
              >
                Expand to 10 km
              </button>
            </div>
          ) : (
            listings.map((item) => {
              const isSelected = selectedListing?.id === item.id;
              const isReady = item.status === 'ready';

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectListing(item)}
                  className={`p-3.5 bg-white rounded-2xl border transition-all cursor-pointer flex gap-3.5 hover:shadow-md ${
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                      : 'border-slate-200/80'
                  }`}
                >
                  {/* Food Thumbnail */}
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                    {item.food_image ? (
                      <img src={item.food_image} alt={item.food_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🍲</div>
                    )}
                    <div className="absolute bottom-1 right-1 bg-slate-900/80 text-white font-bold text-[11px] px-1.5 py-0.5 rounded-md">
                      ${item.price.toFixed(2)}
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            isReady
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                        >
                          {isReady ? 'Ready for Pickup' : 'Preparing'}
                        </span>
                        
                        <span className="text-xs font-bold text-blue-600 flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" />
                          {item.distance_formatted || 'Nearby'}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">
                        {item.food_name}
                      </h4>

                      <p className="text-xs text-slate-500 flex items-center gap-1 line-clamp-1">
                        <span>🧑‍🍳 {item.seller_name}</span>
                        <span>•</span>
                        <span>{item.location_name}</span>
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500">
                        {item.quantity_available} left
                        {item.time_since_ready && ` • ${item.time_since_ready}`}
                      </span>

                      {isReady && !item.reserved_by_current_user && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onQuickReserve(item);
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors active:scale-95"
                        >
                          Reserve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
