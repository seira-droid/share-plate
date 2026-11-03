import React, { useState } from 'react';
import { Listing, GPSLocation } from '../types';
import {
  Search,
  MapPin,
  Sparkles,
  ChefHat,
  ShieldCheck,
  Heart,
  Clock,
  ArrowRight,
  Leaf,
  Navigation,
  CheckCircle2,
  Users,
  Utensils
} from 'lucide-react';

interface LandingPageProps {
  listings: Listing[];
  buyerLocation: GPSLocation;
  onExploreFood: () => void;
  onOpenMap: () => void;
  onBecomeSeller: () => void;
  onSelectListing: (listing: Listing) => void;
  onOpenAuthModal: () => void;
  onSelectLocationPreset?: (loc: { name: string; lat: number; lng: number }) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  listings,
  buyerLocation,
  onExploreFood,
  onOpenMap,
  onBecomeSeller,
  onSelectListing,
  onOpenAuthModal
}) => {
  const [heroSearch, setHeroSearch] = useState('');

  // Get active "ready" or high-priority listings for preview
  const readyListings = listings.filter((l) => l.status === 'ready');
  const previewListings = readyListings.length > 0 ? readyListings.slice(0, 4) : listings.slice(0, 4);

  return (
    <div className="space-y-16 md:space-y-24 pb-12">
      {/* =========================================================================
          HERO SECTION
          ========================================================================= */}
      <section className="relative overflow-hidden pt-6 md:pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Hyperlocal Food Sharing • Kerala Kitchens</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Good Food. <br />
                <span className="text-emerald-700">Nearby Homes.</span> <br />
                Less Waste.
              </h1>

              {/* Supporting Description */}
              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                Discover fresh, authentic homemade meals prepared with care by passionate home cooks in your immediate neighbourhood. When food is hot off the stove, one click broadcasts it to your live map.
              </p>

              {/* Search & Location Box */}
              <div className="bg-white p-2.5 sm:p-3 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80 max-w-xl">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 flex-1 bg-slate-50 rounded-2xl border border-slate-100">
                    <Search className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Search Kerala Sadhya, Dum Biryani, Appam, Dosa..."
                      value={heroSearch}
                      onChange={(e) => setHeroSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onExploreFood();
                      }}
                      className="bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none w-full font-medium"
                    />
                  </div>

                  <button
                    onClick={onExploreFood}
                    className="px-6 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm rounded-2xl shadow-md shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer"
                  >
                    <span>Find Meals</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Location indicator */}
                <div className="flex items-center justify-between px-3 pt-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Searching around: <strong className="text-slate-700">{buyerLocation.addressName || 'Panampilly Nagar, Kochi'}</strong></span>
                  </div>
                  <button
                    onClick={onOpenMap}
                    className="text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                  >
                    View on 3D Map →
                  </button>
                </div>
              </div>

              {/* CTAs & Social Proof */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={onExploreFood}
                  className="px-6 py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-900/15 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Utensils className="w-4 h-4" />
                  <span>Explore Available Food</span>
                </button>

                <button
                  onClick={onBecomeSeller}
                  className="px-6 py-3.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-sm rounded-2xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ChefHat className="w-4 h-4 text-amber-700" />
                  <span>Share from Your Kitchen</span>
                </button>
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200/60 max-w-lg">
                <div>
                  <div className="font-extrabold text-slate-900 text-base sm:text-lg">100%</div>
                  <div className="text-[11px] sm:text-xs text-slate-500">Home-Cooked</div>
                </div>
                <div>
                  <div className="font-extrabold text-emerald-700 text-base sm:text-lg">~150m</div>
                  <div className="text-[11px] sm:text-xs text-slate-500">Privacy Shield</div>
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-base sm:text-lg">Zero</div>
                  <div className="text-[11px] sm:text-xs text-slate-500">Delivery Markups</div>
                </div>
              </div>
            </div>

            {/* Right Food Showcase Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Background decorative blob */}
                <div className="absolute -top-6 -left-6 w-72 h-72 bg-emerald-100/70 rounded-full blur-3xl -z-10" />
                <div className="absolute -bottom-6 -right-6 w-72 h-72 bg-amber-100/70 rounded-full blur-3xl -z-10" />

                {/* Main Image Frame */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-white">
                  <img
                    src="https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80"
                    alt="Authentic Homemade Kerala Sadhya Feast"
                    className="w-full h-80 sm:h-96 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                  {/* Overlaid Food Card Details */}
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="flex items-center justify-between mb-1">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        Ready for Pickup Now
                      </span>
                      <span className="text-xl font-black text-amber-400">₹140</span>
                    </div>
                    <h3 className="font-bold text-lg sm:text-xl drop-shadow-sm">
                      Traditional Kerala Sadhya Lunch Pack
                    </h3>
                    <p className="text-xs text-slate-200 mt-0.5 line-clamp-1">
                      By Lakshmi Menon • House #12B (Panampilly Nagar)
                    </p>
                  </div>
                </div>

                {/* Floating Micro-Badge */}
                <div className="absolute -top-4 -right-2 sm:-right-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base">
                    🌿
                  </div>
                  <div className="text-left text-xs">
                    <div className="font-bold text-slate-900">Zero Preservatives</div>
                    <div className="text-[10px] text-slate-500">Desi Ghee & Coconut Oil</div>
                  </div>
                </div>

                {/* Floating Map Preview Pill */}
                <div className="absolute -bottom-4 -left-2 sm:-left-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base">
                    🗺️
                  </div>
                  <div className="text-left text-xs">
                    <div className="font-bold text-slate-900">Live 3D GPS Map</div>
                    <div className="text-[10px] text-slate-500">Pick up within 5–15 mins walk</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          LIVE AVAILABLE FOOD (HOT FOR PICKUP)
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Available in your neighbourhood</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Freshly Prepared Homemade Dishes
            </h2>
          </div>

          <button
            onClick={onExploreFood}
            className="self-start md:self-auto text-sm font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>See all nearby dishes ({listings.length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Food Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {previewListings.map((listing) => (
            <div
              key={listing.id}
              onClick={() => onSelectListing(listing)}
              className="group bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer hover:-translate-y-1"
            >
              {/* Image Frame */}
              <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                <img
                  src={
                    listing.image_url ||
                    listing.food_image ||
                    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
                  }
                  alt={listing.food_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  {listing.status === 'ready' ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      Ready Now
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md">
                      <Clock className="w-3 h-3" />
                      Preparing
                    </span>
                  )}
                </div>

                {/* Distance Badge */}
                {listing.distance_formatted && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1">
                    <Navigation className="w-2.5 h-2.5 text-emerald-400" />
                    <span>{listing.distance_formatted}</span>
                  </div>
                )}

                {/* Price Tag */}
                <div className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-white/95 backdrop-blur-md text-slate-900 font-black text-sm shadow-sm">
                  ₹{listing.price}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    {listing.category}
                  </div>
                  <h4 className="font-bold text-slate-900 text-base leading-snug group-hover:text-emerald-800 transition-colors line-clamp-1">
                    {listing.food_name}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-1">
                    By {listing.seller_name} • {listing.house_label || 'Home Kitchen'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    {listing.quantity_available} portions left
                  </span>
                  <span className="text-emerald-800 font-bold group-hover:translate-x-0.5 transition-transform">
                    View Details →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          HOW IT WORKS (3 SIMPLE STEPS)
          ========================================================================= */}
      <section className="bg-emerald-900 text-white py-16 rounded-3xl mx-4 sm:mx-6 lg:mx-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="px-3 py-1 rounded-full bg-emerald-800 text-emerald-200 text-xs font-bold uppercase tracking-wider">
              Simple & Community-Driven
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              How SharePlate Works
            </h2>
            <p className="text-emerald-100/80 text-sm sm:text-base">
              A frictionless food sharing loop designed for residential communities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-emerald-800/50 backdrop-blur-md p-6 rounded-3xl border border-emerald-700/60 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg">
                1
              </div>
              <h3 className="text-xl font-bold">Home Cooks Make Extra</h3>
              <p className="text-emerald-100/80 text-sm leading-relaxed">
                When preparing lunch or dinner for their family, home cooks list 2–5 surplus portions with portion size and price.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-emerald-800/50 backdrop-blur-md p-6 rounded-3xl border border-emerald-700/60 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-400 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg">
                2
              </div>
              <h3 className="text-xl font-bold">1-Click "Ready" Broadcast</h3>
              <p className="text-emerald-100/80 text-sm leading-relaxed">
                Once the meal is hot off the stove, the cook taps "Food is Ready". A live WebSocket event instantly places a pulsing green marker on nearby neighbors' maps.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-emerald-800/50 backdrop-blur-md p-6 rounded-3xl border border-emerald-700/60 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-400 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg">
                3
              </div>
              <h3 className="text-xl font-bold">Reserve & Walk Over</h3>
              <p className="text-emerald-100/80 text-sm leading-relaxed">
                Neighbors reserve a portion, the exact house address and pickup instructions unlock, and they take a pleasant 5-minute walk to pick up fresh food.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          WHY CHOOSE SHAREPLATE (CORE VALUE PROPS)
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            Why SharePlate
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Better for You. Better for Your Neighbourhood.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Heart className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-lg">Real Home Cooking</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              No commercial food additives, excess palm oil, or reheated hotel gravies. Just honest food cooked the way mothers cook at home.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-lg">Residential Privacy Shield</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Exact residential door numbers and gate details are never displayed publicly. Only confirmed buyers unlock exact pickup locations.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Leaf className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-lg">Zero Urban Food Waste</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tons of edible surplus food is discarded daily in urban apartments. SharePlate ensures delicious food reaches hungry neighbors instead.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-lg">Neighbourhood Connection</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Get to know the passionate cooks living right across your street. Build lasting neighborhood relationships through food.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SELLER / COOK CALLOUT BANNER
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-left">
            <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider">
              For Passionate Home Cooks
            </span>
            <h3 className="text-2xl sm:text-3xl font-black leading-tight">
              Love cooking? Turn your kitchen into a community food spot.
            </h3>
            <p className="text-amber-100 text-sm leading-relaxed">
              No complex restaurant overheads or commercial setup. List surplus portions of what you are already cooking for your family and earn income while sharing happiness.
            </p>
          </div>

          <button
            onClick={onBecomeSeller}
            className="px-8 py-4 bg-white text-amber-950 hover:bg-amber-50 font-extrabold text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer"
          >
            <ChefHat className="w-5 h-5 text-amber-600" />
            <span>Register Your Kitchen</span>
          </button>
        </div>
      </section>

      {/* =========================================================================
          COMMUNITY STORIES (REALISTIC DEMO TESTIMONIALS)
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Community Stories (Demo)
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Loved by Home Cooks and Hungry Neighbors
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-800 font-bold flex items-center justify-center text-sm">
                LM
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">Lakshmi Menon</div>
                <div className="text-[11px] text-slate-500">Home Cook • Panampilly Nagar</div>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "I always cook a little extra for lunch. Now two college students in my building pick up fresh warm Kerala meals every afternoon. It makes me happy that good food never gets wasted."
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-sm">
                RV
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">Rahul Varma</div>
                <div className="text-[11px] text-slate-500">Buyer • Ravipuram</div>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "Working from home, I was tired of oily restaurant takeout. SharePlate connects me with home cooks making healthy Kerala sadhya right down my street. It takes 4 minutes to walk and pick it up!"
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                DN
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">Divya Nair</div>
                <div className="text-[11px] text-slate-500">Home Cook • Girinagar</div>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "The live map is brilliant. When my hot appam and stew is ready on the stove, I press one button. Neighbors see the pulsing green marker and come over while it is steaming hot."
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
