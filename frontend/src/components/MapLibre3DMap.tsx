import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { Listing, GPSLocation } from '../types';
import {
  Compass,
  Navigation,
  Sparkles
} from 'lucide-react';

interface MapLibre3DMapProps {
  buyerLocation: GPSLocation;
  listings: Listing[];
  radiusKm: number;
  selectedListing: Listing | null;
  onSelectListing: (listing: Listing) => void;
  onQuickReserve: (listing: Listing) => void;
  onMapClickLocation?: (lat: number, lng: number) => void;
  isSellerMode?: boolean;
}

// Reliable zero-key style definitions
const MAP_STYLES = {
  streets: 'https://tiles.openfreemap.org/styles/bright',
  liberty: 'https://tiles.openfreemap.org/styles/liberty',
  positron: 'https://tiles.openfreemap.org/styles/positron',
  // Fallback demo style
  fallback: 'https://demotiles.maplibre.org/style.json'
};

// Pure helper to create GeoJSON circle for radius
function updateRadiusCircle(map: maplibregl.Map, lng: number, lat: number, radiusKm: number) {
  const points = 64;
  const coords: [number, number][] = [];
  const distanceX = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  const distanceY = radiusKm / 110.574;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([lng + x, lat + y]);
  }
  coords.push(coords[0]);

  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [coords]
        }
      }
    ]
  };

  if (map.getSource('radius-circle')) {
    (map.getSource('radius-circle') as maplibregl.GeoJSONSource).setData(geojson);
  } else {
    map.addSource('radius-circle', {
      type: 'geojson',
      data: geojson
    });

    map.addLayer({
      id: 'radius-circle-fill',
      type: 'fill',
      source: 'radius-circle',
      paint: {
        'fill-color': '#2563eb',
        'fill-opacity': 0.08
      }
    });

    map.addLayer({
      id: 'radius-circle-line',
      type: 'line',
      source: 'radius-circle',
      paint: {
        'line-color': '#3b82f6',
        'line-width': 1.5,
        'line-dasharray': [3, 2],
        'line-opacity': 0.6
      }
    });
  }
}

export const MapLibre3DMap: React.FC<MapLibre3DMapProps> = ({
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
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const buyerMarkerRef = useRef<any>(null);
  const [pitch, setPitch] = useState<number>(60);
  const [bearing, setBearing] = useState<number>(-15);
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
  const [activePopupListing, setActivePopupListing] = useState<Listing | null>(null);

  // Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLES.liberty,
        center: [buyerLocation.lng, buyerLocation.lat],
        zoom: 14.5,
        pitch: 60,
        bearing: -15,
        maxPitch: 75,
        attributionControl: false
      });

      // Navigation controls
      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');

      map.on('load', () => {
        setIsMapLoaded(true);

        // Add 3D Building Extrusions if the style has building data
        try {
          const layers = map.getStyle().layers;
          const labelLayerId = layers?.find(
            (layer: any) => layer.type === 'symbol' && layer.layout?.['text-field']
          )?.id;

          // Check if building source exists
          if (map.getSource('openmaptiles') && !map.getLayer('3d-buildings')) {
            map.addLayer(
              {
                id: '3d-buildings',
                source: 'openmaptiles',
                'source-layer': 'building',
                type: 'fill-extrusion',
                minzoom: 13,
                paint: {
                  'fill-extrusion-color': [
                    'interpolate',
                    ['linear'],
                    ['get', 'render_height'],
                    0, '#e2e8f0',
                    30, '#cbd5e1',
                    80, '#94a3b8'
                  ],
                  'fill-extrusion-height': ['get', 'render_height'],
                  'fill-extrusion-base': ['get', 'render_min_height'],
                  'fill-extrusion-opacity': 0.82
                }
              },
              labelLayerId
            );
          }
        } catch (e) {
          console.warn('3D building extrusion setup notice:', e);
        }

        // Add buyer radius circle source & layer
        updateRadiusCircle(map, buyerLocation.lng, buyerLocation.lat, radiusKm);
      });

      map.on('rotate', () => {
        setBearing(Math.round(map.getBearing()));
      });

      map.on('pitch', () => {
        setPitch(Math.round(map.getPitch()));
      });

      map.on('click', (e: any) => {
        if (onMapClickLocation) {
          onMapClickLocation(e.lngLat.lat, e.lngLat.lng);
        }
      });

      mapRef.current = map;
    } catch (err) {
      console.error('Failed to initialize MapLibre 3D map:', err);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update center when buyerLocation changes
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;
    mapRef.current.flyTo({
      center: [buyerLocation.lng, buyerLocation.lat],
      duration: 1200,
      essential: true
    });
    updateRadiusCircle(mapRef.current, buyerLocation.lng, buyerLocation.lat, radiusKm);
  }, [buyerLocation.lat, buyerLocation.lng, radiusKm, isMapLoaded]);

  // Update buyer marker
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;

    if (!buyerMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'relative flex items-center justify-center cursor-pointer';
      el.innerHTML = `
        <div class="absolute w-9 h-9 rounded-full bg-blue-500 opacity-30 buyer-pulse"></div>
        <div class="relative w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center">
          <div class="w-2.5 h-2.5 bg-white rounded-full"></div>
        </div>
        <div class="absolute -bottom-5 bg-blue-900/90 text-white font-bold text-[9px] px-1.5 py-0.5 rounded shadow whitespace-nowrap pointer-events-none">
          YOU ARE HERE
        </div>
      `;
      buyerMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([buyerLocation.lng, buyerLocation.lat])
        .addTo(mapRef.current);
    } else {
      buyerMarkerRef.current.setLngLat([buyerLocation.lng, buyerLocation.lat]);
    }
  }, [buyerLocation.lat, buyerLocation.lng, isMapLoaded]);

  // Update listings markers
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;
    const map = mapRef.current;

    const currentListingIds = new Set(listings.map((l) => l.id));

    // Remove markers that are no longer in listings
    markersRef.current.forEach((marker, id) => {
      if (!currentListingIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add or update markers
    listings.forEach((listing) => {
      let marker = markersRef.current.get(listing.id);

      // Determine styling according to status
      let bgGrad = 'from-emerald-500 to-green-600';
      let shadowColor = 'shadow-emerald-500/40';
      let icon = '🍲';
      let pulseRing = '';

      if (listing.status === 'ready') {
        bgGrad = 'from-emerald-500 to-teal-600';
        shadowColor = 'shadow-emerald-500/50';
        icon = '🍲';
        pulseRing = '<div class="absolute -inset-1.5 rounded-full bg-emerald-400 opacity-75 animate-ping pointer-events-none"></div>';
      } else if (listing.status === 'preparing') {
        bgGrad = 'from-amber-500 to-orange-500';
        shadowColor = 'shadow-amber-500/40';
        icon = '🍳';
      } else if (listing.status === 'reserved') {
        bgGrad = 'from-blue-600 to-indigo-600';
        shadowColor = 'shadow-blue-500/40';
        icon = '🏷️';
      } else {
        // sold out
        bgGrad = 'from-slate-400 to-slate-500';
        shadowColor = 'shadow-slate-400/20';
        icon = '🍽️';
      }

      if (!marker) {
        const el = document.createElement('div');
        el.className = 'custom-food-marker group relative';
        el.innerHTML = `
          ${pulseRing}
          <div class="relative w-11 h-11 rounded-2xl bg-gradient-to-br ${bgGrad} border-2 border-white shadow-xl ${shadowColor} flex flex-col items-center justify-center text-lg transform transition-all group-hover:scale-115 cursor-pointer">
            <span>${icon}</span>
            <span class="absolute -bottom-2 bg-slate-900/90 text-white font-black text-[9px] px-1.5 py-0.2 rounded-full border border-white/40 shadow">
              ₹${listing.price.toFixed(0)}
            </span>
          </div>
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setActivePopupListing(listing);
          map.flyTo({
            center: [listing.longitude, listing.latitude],
            zoom: 16,
            pitch: 65,
            duration: 800
          });
        });

        marker = new maplibregl.Marker({ element: el })
          .setLngLat([listing.longitude, listing.latitude])
          .addTo(map);

        markersRef.current.set(listing.id, marker);
      } else {
        marker.setLngLat([listing.longitude, listing.latitude]);
      }
    });
  }, [listings, isMapLoaded]);

  // 3D Tilt adjustment
  const handleSetPitch = (newPitch: number) => {
    if (!mapRef.current) return;
    mapRef.current.easeTo({ pitch: newPitch, duration: 600 });
    setPitch(newPitch);
  };

  // Reset Bearing to North
  const handleResetNorth = () => {
    if (!mapRef.current) return;
    mapRef.current.easeTo({ bearing: 0, pitch: 60, duration: 800 });
  };

  // Recenter on buyer
  const handleLocateMe = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: [buyerLocation.lng, buyerLocation.lat],
      zoom: 15,
      pitch: 60,
      duration: 1000
    });
  };

  return (
    <div className="relative w-full h-[580px] md:h-[620px] rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-slate-900">
      {/* 3D Map Viewport */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* 3D Perspective Badge & Controls */}
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 shadow-lg text-white text-xs">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Real-Time 3D GPS Map</span>
          </div>
          <span className="text-white/30">|</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleSetPitch(0)}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                pitch === 0 ? 'bg-blue-600 text-white' : 'bg-white/10 hover:bg-white/20 text-slate-300'
              }`}
            >
              2D Flat
            </button>
            <button
              onClick={() => handleSetPitch(60)}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                pitch === 60 ? 'bg-blue-600 text-white' : 'bg-white/10 hover:bg-white/20 text-slate-300'
              }`}
            >
              3D Dynamic
            </button>
            <button
              onClick={() => handleSetPitch(75)}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                pitch === 75 ? 'bg-blue-600 text-white' : 'bg-white/10 hover:bg-white/20 text-slate-300'
              }`}
            >
              3D Horizon
            </button>
          </div>
        </div>

        {/* Camera Tilt & Recenter Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-900/85 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-lg text-white">
          <button
            onClick={handleResetNorth}
            title="Reset North & Bearing"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <Compass
              className="w-4 h-4 text-orange-400 transition-transform"
              style={{ transform: `rotate(${-bearing}deg)` }}
            />
            <span>{bearing}° N</span>
          </button>
          <div className="w-px h-4 bg-white/20" />
          <button
            onClick={handleLocateMe}
            title="Fly to My GPS Position"
            className="p-1.5 rounded-xl hover:bg-white/10 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Status Marker Legend */}
      <div className="absolute bottom-6 left-4 z-10 pointer-events-auto hidden sm:flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 text-[11px] text-white shadow-xl">
        <span className="font-bold text-white/70 uppercase text-[9px] tracking-wider">Statuses:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-400"></span>
          <span>Ready (Live)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <span>Preparing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-600"></span>
          <span>Reserved</span>
        </div>
        <div className="flex items-center gap-1.5 text-white/50">
          <span className="w-3 h-3 rounded-full bg-slate-500"></span>
          <span>Sold Out</span>
        </div>
      </div>

      {/* Interactive Bottom Sheet / Selected Food Card */}
      {activePopupListing && (
        <div className="absolute bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-20 pointer-events-auto animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 shadow-2xl border border-slate-200 text-slate-800 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <img
                  src={activePopupListing.food_image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d'}
                  alt={activePopupListing.food_name}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm flex-shrink-0"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                      {activePopupListing.category}
                    </span>
                    {activePopupListing.status === 'ready' && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                        Food Ready
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mt-0.5 leading-snug">
                    {activePopupListing.food_name}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    By {activePopupListing.seller_name}{' '}
                    {activePopupListing.house_label ? `• ${activePopupListing.house_label}` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActivePopupListing(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Portions & Distance Details */}
            <div className="grid grid-cols-2 gap-2 text-xs p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Portion / Size:</span>
                <span className="font-bold text-slate-800 truncate block">
                  {activePopupListing.portion_size || '1 Full Plate'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Distance:</span>
                <span className="font-bold text-blue-700">
                  📍 {activePopupListing.distance_formatted || `${activePopupListing.distance_km?.toFixed(2) || '0.8'} km away`}
                </span>
              </div>
            </div>

            {/* Price & Action Buttons */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Price</span>
                <div className="text-xl font-black text-slate-900">
                  ₹{activePopupListing.price.toFixed(0)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectListing(activePopupListing)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  View Details
                </button>
                {activePopupListing.status === 'ready' && activePopupListing.quantity_available > 0 && (
                  <button
                    onClick={() => onQuickReserve(activePopupListing)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Reserve Food</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
