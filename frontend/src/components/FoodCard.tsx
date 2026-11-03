import React from 'react';
import { Listing } from '../types';
import { Clock, MapPin, ChefHat, Navigation, CheckCircle2, AlertCircle } from 'lucide-react';

interface FoodCardProps {
  listing: Listing;
  onSelect: (listing: Listing) => void;
  onQuickReserve?: (listing: Listing) => void;
  isCompact?: boolean;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  listing,
  onSelect,
  onQuickReserve,
  isCompact = false
}) => {
  const isReady = listing.status === 'ready';
  const isPreparing = listing.status === 'preparing';
  const isSoldOut = listing.status === 'sold_out' || (listing.quantity_available !== undefined && listing.quantity_available <= 0);
  const isReserved = listing.status === 'reserved';

  const defaultImg = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
  const displayImg = listing.image_url || listing.food_image || defaultImg;

  // Approximate walking time calculation (~5 km/h -> 1 km is 12 mins)
  const walkingTime = listing.distance_km ? Math.round(listing.distance_km * 12) : null;

  return (
    <div
      onClick={() => onSelect(listing)}
      className="group bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer hover:-translate-y-1 relative"
    >
      {/* Food Image with Overlays */}
      <div className={`relative ${isCompact ? 'h-40' : 'h-48'} w-full bg-slate-100 overflow-hidden`}>
        <img
          src={displayImg}
          alt={listing.food_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

        {/* Status Pill */}
        <div className="absolute top-3 left-3">
          {isReady ? (
            <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/20">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Ready for Pickup
            </span>
          ) : isPreparing ? (
            <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md shadow-amber-950/20">
              <Clock className="w-3 h-3" />
              Cooking Now
            </span>
          ) : isReserved ? (
            <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md shadow-blue-950/20">
              <CheckCircle2 className="w-3 h-3" />
              Reserved
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-slate-600 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md">
              <AlertCircle className="w-3 h-3" />
              Sold Out
            </span>
          )}
        </div>

        {/* Distance Badge */}
        {listing.distance_formatted && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1 shadow-sm">
            <Navigation className="w-2.5 h-2.5 text-emerald-400" />
            <span>{listing.distance_formatted}</span>
            {walkingTime && <span className="text-white/60 text-[10px]">({walkingTime}m walk)</span>}
          </div>
        )}

        {/* Price & Quantity pill at bottom of image */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-lg bg-black/40 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-white/90 border border-white/10">
              {listing.category}
            </span>
            {listing.meal_time && (
              <span className="px-2 py-0.5 rounded-lg bg-black/40 backdrop-blur-md text-[10px] font-semibold text-amber-300 border border-white/10 hidden sm:inline-block">
                {listing.meal_time}
              </span>
            )}
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-white text-slate-900 font-black text-sm shadow-md">
            ₹{listing.price}
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-emerald-800 transition-colors line-clamp-1">
            {listing.food_name}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <ChefHat className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
            <span className="font-medium truncate">{listing.seller_name}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 truncate text-[11px]">{listing.house_label || 'Home Kitchen'}</span>
          </div>

          {listing.portion_size && (
            <p className="text-[11px] text-slate-500 line-clamp-1 pt-0.5">
              🍱 {listing.portion_size}
            </p>
          )}
        </div>

        {/* Card Footer Action */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-slate-500 font-medium">
            <span className={`w-2 h-2 rounded-full ${isSoldOut ? 'bg-slate-400' : 'bg-emerald-500'}`} />
            <span>
              {isSoldOut ? '0 portions' : `${listing.quantity_available ?? listing.quantity} portions left`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onQuickReserve && !isSoldOut && !listing.reserved_by_current_user && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickReserve(listing);
                }}
                className="px-3 py-1 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Reserve
              </button>
            )}

            <span className="text-emerald-800 font-bold group-hover:translate-x-0.5 transition-transform">
              Details →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
