import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Listing, GPSLocation } from '../types';
import { Shield, Clock, ChefHat, Navigation, ExternalLink, BookmarkPlus } from 'lucide-react';

interface BuyerMapProps {
  buyerLocation: GPSLocation;
  listings: Listing[];
  radiusKm: number;
  selectedListing: Listing | null;
  onSelectListing: (listing: Listing) => void;
  onQuickReserve: (listing: Listing) => void;
  onMapClickLocation?: (lat: number, lng: number) => void;
  isSellerMode?: boolean;
}

// Custom Marker Generator
function createMarkerIcon(status: string, isPulse: boolean = false) {
  let bgClass = 'bg-emerald-500';
  let borderClass = 'border-white';
  let shadowClass = 'shadow-emerald-500/30';
  let iconEmoji = '🍲';
  let pulseHtml = '';

  if (status === 'ready') {
    bgClass = 'bg-emerald-500 text-white';
    iconEmoji = '🍲';
    if (isPulse) {
      pulseHtml = '<div class="absolute -inset-1 rounded-full bg-emerald-400 opacity-75 animate-ping"></div>';
    }
  } else if (status === 'preparing') {
    bgClass = 'bg-amber-500 text-white';
    iconEmoji = '🍳';
  } else if (status === 'reserved') {
    bgClass = 'bg-sky-600 text-white';
    iconEmoji = '🏷️';
  } else {
    // sold_out
    bgClass = 'bg-slate-400 text-white';
    iconEmoji = '🍽️';
  }

  const html = `
    <div class="relative flex items-center justify-center custom-food-marker">
      ${pulseHtml}
      <div class="w-10 h-10 ${bgClass} rounded-full border-2 ${borderClass} shadow-lg ${shadowClass} flex items-center justify-center text-lg transform hover:scale-110 transition-transform">
        ${iconEmoji}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-div-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22]
  });
}

function createBuyerIcon() {
  const html = `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-8 h-8 rounded-full bg-blue-500 opacity-40 buyer-pulse"></div>
      <div class="w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-md flex items-center justify-center">
        <div class="w-2 h-2 bg-white rounded-full"></div>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'buyer-marker-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18]
  });
}

export const BuyerMap: React.FC<BuyerMapProps> = ({
  buyerLocation,
  listings,
  radiusKm,
  selectedListing,
  onSelectListing,
  onQuickReserve,
  onMapClickLocation,
  isSellerMode = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const buyerMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [buyerLocation.lat, buyerLocation.lng],
      zoom: 14,
      zoomControl: false
    });

    // Clean OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    // Zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Handle map clicks
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onMapClickLocation) {
        onMapClickLocation(e.latlng.lat, e.latlng.lng);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Buyer Location Marker & Radius Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const latLng: [number, number] = [buyerLocation.lat, buyerLocation.lng];

    // Buyer Marker
    if (!buyerMarkerRef.current) {
      buyerMarkerRef.current = L.marker(latLng, {
        icon: createBuyerIcon(),
        zIndexOffset: 1000
      })
        .addTo(map)
        .bindPopup(`
          <div class="text-xs font-semibold text-slate-800 p-1">
            📍 You are here<br/>
            <span class="text-slate-500 font-normal">${buyerLocation.addressName || 'Live GPS Position'}</span>
          </div>
        `);
    } else {
      buyerMarkerRef.current.setLatLng(latLng);
    }

    // Radius Circle
    if (!radiusCircleRef.current) {
      radiusCircleRef.current = L.circle(latLng, {
        radius: radiusKm * 1000,
        color: '#3b82f6',
        fillColor: '#60a5fa',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '4, 6'
      }).addTo(map);
    } else {
      radiusCircleRef.current.setLatLng(latLng);
      radiusCircleRef.current.setRadius(radiusKm * 1000);
    }
  }, [buyerLocation, radiusKm]);

  // Update Food Listing Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    listings.forEach((listing) => {
      const isSelected = selectedListing?.id === listing.id;
      const isReady = listing.status === 'ready';
      const marker = L.marker([listing.latitude, listing.longitude], {
        icon: createMarkerIcon(listing.status, isReady),
        zIndexOffset: isSelected ? 900 : isReady ? 500 : 100
      });

      // Construct popup HTML
      const statusColor = 
        listing.status === 'ready' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
        listing.status === 'preparing' ? 'bg-amber-100 text-amber-800 border-amber-200' :
        listing.status === 'reserved' ? 'bg-sky-100 text-sky-800 border-sky-200' :
        'bg-slate-100 text-slate-800 border-slate-200';

      const statusLabel = 
        listing.status === 'ready' ? 'Ready for Pickup' :
        listing.status === 'preparing' ? 'Preparing' :
        listing.status === 'reserved' ? 'Reserved' : 'Sold Out';

      const imgHtml = listing.food_image
        ? `<div class="w-full h-28 overflow-hidden rounded-t-lg bg-slate-100 mb-2 relative">
             <img src="${listing.food_image}" alt="${listing.food_name}" class="w-full h-full object-cover"/>
             <div class="absolute top-2 right-2 bg-slate-900/85 text-white font-bold text-xs px-2.5 py-0.5 rounded-full backdrop-blur-sm">
               ₹${listing.price.toFixed(0)}
             </div>
           </div>`
        : `<div class="flex justify-between items-center mb-2">
             <span class="font-bold text-emerald-600 text-base">₹${listing.price.toFixed(0)}</span>
           </div>`;

      const popupContent = document.createElement('div');
      popupContent.className = 'w-64 max-w-xs p-1 font-sans';
      popupContent.innerHTML = `
        ${imgHtml}
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-xs px-2 py-0.5 rounded-full border font-semibold ${statusColor}">${statusLabel}</span>
            <span class="text-xs font-semibold text-slate-500 flex items-center">
              📍 ${listing.distance_formatted || 'Nearby'}
            </span>
          </div>
          <h4 class="font-bold text-slate-900 text-sm leading-snug line-clamp-1">${listing.food_name}</h4>
          <p class="text-xs text-orange-700 font-medium flex items-center gap-1">
            <span>🏠 ${listing.house_label || listing.seller_name}</span>
          </p>
          <div class="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-100 flex items-center justify-between">
            <span>📦 <strong>Portion:</strong> ${listing.portion_size || '1 Full Plate'}</span>
            <span>🌶️ ${listing.spice_level || 'Medium'}</span>
          </div>
          <div class="text-[11px] text-slate-500 flex items-center gap-1">
            <span class="inline-block w-2 h-2 rounded-full ${listing.is_exact_location ? 'bg-emerald-500' : 'bg-amber-400'}"></span>
            <span>${listing.is_exact_location ? 'Exact Pickup Address' : 'Approximate Area (Privacy Safe)'}</span>
          </div>
          ${listing.time_since_ready ? `<div class="text-[11px] text-emerald-600 font-medium">⏱️ Ready ${listing.time_since_ready}</div>` : ''}
          <div class="pt-2 flex gap-1.5">
            <button id="view-details-${listing.id}" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-1.5 px-2 rounded-md font-semibold transition-colors">
              View Details
            </button>
            ${
              listing.status === 'ready' && !listing.reserved_by_current_user && !isSellerMode
                ? `<button id="reserve-btn-${listing.id}" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1.5 px-2 rounded-md font-semibold shadow-sm transition-colors">
                     Reserve (₹${listing.price.toFixed(0)})
                   </button>`
                : ''
            }
          </div>
        </div>
      `;

      // Attach button events after popup is DOM rendered
      marker.bindPopup(popupContent, { maxWidth: 300 });

      marker.on('popupopen', () => {
        const viewBtn = document.getElementById(`view-details-${listing.id}`);
        if (viewBtn) {
          viewBtn.onclick = (e) => {
            e.stopPropagation();
            onSelectListing(listing);
          };
        }
        const reserveBtn = document.getElementById(`reserve-btn-${listing.id}`);
        if (reserveBtn) {
          reserveBtn.onclick = (e) => {
            e.stopPropagation();
            onQuickReserve(listing);
          };
        }
      });

      marker.on('click', () => {
        onSelectListing(listing);
      });

      marker.addTo(group);
    });
  }, [listings, selectedListing, isSellerMode, onSelectListing, onQuickReserve]);

  const handleCenterOnMe = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([buyerLocation.lat, buyerLocation.lng], 14, { duration: 1.2 });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[380px] rounded-2xl overflow-hidden shadow-inner border border-slate-200/80 bg-slate-100">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Map Controls & Overlays */}
      <div className="absolute top-3 left-3 z-[400] flex flex-col gap-2">
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200/80 flex items-center gap-2 text-xs font-semibold text-slate-700">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>{listings.filter(l => l.status === 'ready').length} Ready Nearby</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">Radius: {radiusKm} km</span>
        </div>
      </div>

      {/* Center on Me Button */}
      <div className="absolute top-3 right-3 z-[400]">
        <button
          onClick={handleCenterOnMe}
          title="Center on my GPS Location"
          className="bg-white/95 hover:bg-white text-slate-700 hover:text-blue-600 p-2.5 rounded-xl shadow-md border border-slate-200/80 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        >
          <Navigation className="w-4 h-4" />
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/90 backdrop-blur-md p-2.5 rounded-xl shadow-md border border-slate-200/80 hidden sm:flex items-center gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
          <span className="font-medium text-slate-700">Ready</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
          <span>Preparing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-sky-600 inline-block"></span>
          <span>Reserved</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-slate-400 inline-block"></span>
          <span>Sold Out</span>
        </div>
      </div>
    </div>
  );
};

