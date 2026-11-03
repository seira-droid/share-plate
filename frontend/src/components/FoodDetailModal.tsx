import React, { useState } from 'react';
import { Listing } from '../types';
import {
  X,
  Clock,
  ShieldCheck,
  ChefHat,
  Navigation,
  ExternalLink,
  Minus,
  Plus,
  Lock
} from 'lucide-react';

interface FoodDetailModalProps {
  listing: Listing | null;
  onClose: () => void;
  onReserve: (listingId: string, quantity: number, phone?: string) => Promise<void>;
  onCancelReservation: (listingId: string, reservationId?: string) => Promise<void>;
  isSeller?: boolean;
}

export const FoodDetailModal: React.FC<FoodDetailModalProps> = ({
  listing,
  onClose,
  onReserve,
  onCancelReservation,
  isSeller = false
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [buyerPhone, setBuyerPhone] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!listing) return null;

  const isReservedByMe = listing.reserved_by_current_user;
  const isReady = listing.status === 'ready';
  const isPreparing = listing.status === 'preparing';
  const isSoldOut = listing.status === 'sold_out' || (listing.quantity_available !== undefined && listing.quantity_available <= 0);

  const maxPortions = listing.quantity_available || 1;
  const totalPrice = listing.price * quantity;

  const handleReserve = async () => {
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await onReserve(listing.id, quantity, buyerPhone || undefined);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete reservation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await onCancelReservation(listing.id, listing.active_reservation_id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to cancel reservation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultImg = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
  const displayImg = listing.image_url || listing.food_image || defaultImg;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn"
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Food Image Frame */}
        <div className="relative h-60 w-full bg-slate-100 flex-shrink-0 overflow-hidden">
          <img
            src={displayImg}
            alt={listing.food_name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

          {/* Status & Category Overlay */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-md text-slate-800 shadow-sm">
              {listing.category}
            </span>

            {isReady ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Ready for Pickup
              </span>
            ) : isPreparing ? (
              <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md">
                <Clock className="w-3.5 h-3.5" />
                Cooking Now
              </span>
            ) : null}
          </div>

          {/* Bottom Title Bar */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black leading-tight drop-shadow-sm">
                  {listing.food_name}
                </h2>
                <div className="flex items-center gap-2 text-xs text-white/80 mt-1">
                  <ChefHat className="w-3.5 h-3.5 text-amber-400" />
                  <span>{listing.seller_name}</span>
                  <span>•</span>
                  <span>{listing.house_label || 'Home Kitchen'}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black text-amber-400">
                  ₹{listing.price}
                </div>
                <div className="text-[10px] text-white/70">per portion</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-left">
          {/* Description */}
          {listing.description && (
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                About this dish
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                {listing.description}
              </p>
            </div>
          )}

          {/* Portion & Dietary Details Grid */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Portion Sizing</span>
              <span className="font-bold text-slate-800">
                🍱 {listing.portion_size || '1 Full Plate'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Meal Time</span>
              <span className="font-bold text-slate-800">
                ⏰ {listing.meal_time || 'Lunch / Dinner'}
              </span>
            </div>

            {listing.items_included && (
              <div className="col-span-2 pt-1 border-t border-slate-200/60">
                <span className="text-slate-400 block text-[11px]">Items Included</span>
                <span className="font-medium text-slate-700">
                  {listing.items_included}
                </span>
              </div>
            )}

            {listing.dietary_tags && (
              <div className="col-span-2 pt-1 border-t border-slate-200/60">
                <span className="text-slate-400 block text-[11px]">Dietary Notes</span>
                <span className="font-medium text-emerald-800">
                  🌿 {listing.dietary_tags}
                </span>
              </div>
            )}
          </div>

          {/* RESIDENTIAL PRIVACY & PICKUP LOCATION SECTION */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pickup Location
            </h4>

            {listing.is_exact_location || isReservedByMe ? (
              /* UNLOCKED EXACT ADDRESS */
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Exact Door Address Unlocked</span>
                </div>

                <div className="text-sm font-bold text-slate-900 pl-6">
                  📍 {listing.pickup_address}
                </div>

                {listing.pickup_instructions && (
                  <div className="text-xs text-slate-700 pl-6 italic">
                    💬 "{listing.pickup_instructions}"
                  </div>
                )}

                <div className="pl-6 pt-1">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Open in Google Maps</span>
                    <ExternalLink className="w-3 h-3 text-emerald-600" />
                  </a>
                </div>
              </div>
            ) : (
              /* PRIVACY PERIMETER PREVIEW */
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Neighborhood: {listing.location_name || 'Panampilly Nagar'}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed pl-5">
                  To protect our home cooks' household privacy, exact door numbers and gate instructions unlock automatically after your reservation is placed.
                </p>
                {listing.distance_formatted && (
                  <div className="text-xs font-semibold text-emerald-700 pl-5 pt-0.5">
                    🚶 Approx. {listing.distance_formatted} from your location
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reservation Controls */}
          {!isSeller && !isSoldOut && !isReservedByMe && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Select Portions:</span>
                <div className="flex items-center gap-3 bg-white px-2 py-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5 text-slate-700" />
                  </button>
                  <span className="font-extrabold text-sm text-slate-900 w-6 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(maxPortions, quantity + 1))}
                    disabled={quantity >= maxPortions}
                    className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-700" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Contact Phone (for pickup coordination):
                </label>
                <input
                  type="tel"
                  placeholder="+91 98460-XXXXX"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                <span className="text-slate-500">Total Amount:</span>
                <span className="text-lg font-black text-emerald-800">₹{totalPrice}</span>
              </div>
            </div>
          )}

          {/* Error Message Feedback */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              ⚠️ {errorMsg}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>

          {isReservedByMe ? (
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              {isSubmitting ? 'Cancelling...' : 'Cancel Reservation'}
            </button>
          ) : isSoldOut ? (
            <span className="px-5 py-2.5 rounded-xl bg-slate-200 text-slate-500 text-xs font-bold">
              Sold Out
            </span>
          ) : isSeller ? (
            <span className="px-4 py-2 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold">
              Your Kitchen Listing
            </span>
          ) : (
            <button
              onClick={handleReserve}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-extrabold transition-all shadow-md shadow-emerald-950/15 cursor-pointer flex items-center gap-2"
            >
              <span>{isSubmitting ? 'Reserving...' : `Confirm & Unlock Address (₹${totalPrice})`}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
