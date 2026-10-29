import React, { useState } from 'react';
import { Listing } from '../types';
import { X, MapPin, Clock, ShieldCheck, ChefHat, CheckCircle2, AlertTriangle, Phone, Navigation } from 'lucide-react';

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

  const handleReserve = async () => {
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await onReserve(listing.id, quantity, buyerPhone);
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

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Food Image */}
        <div className="relative h-56 w-full bg-slate-100 flex-shrink-0">
          {listing.food_image ? (
            <img
              src={listing.food_image}
              alt={listing.food_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-600 text-6xl">
              🍲
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/20 backdrop-blur-md mb-1.5 border border-white/20">
                {listing.category}
              </span>
              <h2 className="text-xl md:text-2xl font-bold leading-tight drop-shadow-sm">
                {listing.food_name}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-amber-400 drop-shadow-sm">
                ₹{listing.price.toFixed(0)}
              </span>
              <span className="block text-[11px] text-white/80">per portion</span>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Badges row */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {listing.status === 'ready' && (
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Food is Ready for Pickup
              </span>
            )}
            {listing.status === 'preparing' && (
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Currently Preparing
              </span>
            )}
            {listing.status === 'reserved' && (
              <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-800 font-semibold border border-sky-200">
                Reserved
              </span>
            )}
            {listing.distance_formatted && (
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                {listing.distance_formatted} from you
              </span>
            )}
            {listing.time_since_ready && (
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Ready {listing.time_since_ready}
              </span>
            )}
          </div>

          {/* Seller & House Profile */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {listing.seller_name.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{listing.seller_name}</h4>
                <p className="text-xs text-orange-700 font-semibold flex items-center gap-1">
                  <span>🏠 {listing.house_label || 'Local Home Kitchen'}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-700">
                {listing.quantity_available} {listing.quantity_available === 1 ? 'portion' : 'portions'} left
              </span>
            </div>
          </div>

          {/* Portion & Meal Specifications Box */}
          <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 space-y-2">
            <h5 className="text-xs font-bold text-orange-950 uppercase tracking-wider flex items-center gap-1">
              <span>📦 Portion Details & Items Included</span>
            </h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-white rounded-xl border border-orange-100">
                <span className="text-slate-500 block text-[10px] font-semibold">Serving Size</span>
                <span className="font-bold text-slate-800">{listing.portion_size || '1 Full Meal Plate'}</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-orange-100">
                <span className="text-slate-500 block text-[10px] font-semibold">Spice & Timing</span>
                <span className="font-bold text-slate-800">🌶️ {listing.spice_level || 'Medium'} • {listing.meal_time || 'Lunch'}</span>
              </div>
            </div>
            {listing.items_included && (
              <div className="text-xs text-slate-700 pt-1">
                <strong className="text-slate-900">What's in 1 Portion: </strong>
                <span>{listing.items_included}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {listing.description && (
            <div>
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Description</h5>
              <p className="text-sm text-slate-700 leading-relaxed">{listing.description}</p>
            </div>
          )}

          {/* Dietary Tags */}
          {listing.dietary_tags && (
            <div>
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Dietary Notes</h5>
              <div className="flex flex-wrap gap-1.5">
                {listing.dietary_tags.split(',').map((tag, idx) => (
                  <span key={idx} className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                    🌱 {tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Privacy & Location Box */}
          <div className={`p-4 rounded-2xl border ${isReservedByMe || isSeller ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-start gap-3">
              {isReservedByMe || isSeller ? (
                <div className="p-2 bg-emerald-500 text-white rounded-xl flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl flex-shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h5 className="text-sm font-bold text-slate-900">
                    {isReservedByMe || isSeller ? 'Exact Pickup Location Unlocked' : 'Approximate Neighborhood'}
                  </h5>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isReservedByMe || isSeller ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'}`}>
                    {isReservedByMe || isSeller ? 'Private Address Revealed' : 'Privacy Protected'}
                  </span>
                </div>
                
                <p className="text-xs text-slate-600">
                  {listing.pickup_address || listing.location_name}
                </p>

                {/* Pickup Instructions */}
                {listing.pickup_instructions && (
                  <div className="mt-2 pt-2 border-t border-slate-200/60 text-xs text-slate-700">
                    <span className="font-semibold text-slate-800">Pickup Instructions: </span>
                    {listing.pickup_instructions}
                  </div>
                )}

                {/* Navigation CTA if exact location unlocked */}
                {(isReservedByMe || isSeller) && (
                  <div className="pt-2">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Open in Google Maps
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
          {isReservedByMe ? (
            <div className="w-full flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> You reserved this food
              </span>
              <button
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-xl transition-colors"
              >
                {isSubmitting ? 'Cancelling...' : 'Cancel Reservation'}
              </button>
            </div>
          ) : isSeller ? (
            <div className="w-full text-center text-xs text-slate-500 font-medium">
              You are the seller of this listing. Manage status from your Seller Dashboard.
            </div>
          ) : (
            <>
              {listing.status === 'ready' || listing.status === 'preparing' ? (
                <div className="w-full flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-xs text-slate-500 font-medium">Qty:</label>
                    <select
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="bg-transparent text-sm font-bold text-slate-800 outline-none"
                    >
                      {Array.from({ length: Math.min(listing.quantity_available, 10) }, (_, i) => i + 1).map((q) => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    onClick={handleReserve}
                    disabled={isSubmitting || listing.quantity_available <= 0}
                    className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Reserving...</span>
                    ) : (
                      <>
                        <span>Reserve Food</span>
                        <span>•</span>
                        <span>₹{(listing.price * quantity).toFixed(0)}</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="w-full text-center py-2 text-xs font-semibold text-slate-500 bg-slate-200 rounded-xl">
                  {listing.status === 'reserved' ? 'Currently Reserved by Another Neighbor' : 'Sold Out'}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

