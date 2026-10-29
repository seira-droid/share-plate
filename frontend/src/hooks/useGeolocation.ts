import { useState, useEffect, useCallback } from 'react';
import type { GPSLocation } from '../types';

export const PRESET_LOCATIONS = [
  { name: 'Bengaluru - Indiranagar 1st Stage', lat: 12.9784, lng: 77.6408 },
  { name: 'Bengaluru - Koramangala 4th Block', lat: 12.9352, lng: 77.6245 },
  { name: 'Kochi - Panampilly Nagar', lat: 9.9625, lng: 76.2990 },
  { name: 'Kochi - Kakkanad InfoPark Area', lat: 10.0159, lng: 76.3419 },
  { name: 'Mumbai - Bandra West (Pali Hill)', lat: 19.0596, lng: 72.8295 },
  { name: 'Delhi - Connaught Place', lat: 28.6304, lng: 77.2177 }
];

export function useGeolocation() {
  const [location, setLocation] = useState<GPSLocation>({
    lat: PRESET_LOCATIONS[0].lat,
    lng: PRESET_LOCATIONS[0].lng,
    status: 'locating',
    addressName: PRESET_LOCATIONS[0].name
  });

  const [isWatching, setIsWatching] = useState<boolean>(false);

  const requestRealGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({ ...prev, status: 'fallback', addressName: 'Browser GPS Not Supported' }));
      return;
    }

    setLocation(prev => ({ ...prev, status: 'locating' }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          status: 'granted',
          addressName: 'Live Device GPS'
        });
      },
      (err) => {
        console.warn('GPS permission denied or unavailable:', err.message);
        setLocation(prev => ({
          ...prev,
          status: 'denied',
          addressName: 'Default Location (GPS Denied)'
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000
      }
    );
  }, []);

  // Continuous tracking
  useEffect(() => {
    if (!isWatching || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation(prev => ({
          ...prev,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          status: 'granted',
          addressName: 'Live Device GPS (Tracking)'
        }));
      },
      (err) => console.warn('GPS watch error:', err),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isWatching]);

  // Request GPS on mount
  useEffect(() => {
    requestRealGPS();
  }, [requestRealGPS]);

  const setManualLocation = useCallback((lat: number, lng: number, name: string = 'Manual GPS Pin') => {
    setLocation({
      lat,
      lng,
      status: 'granted',
      addressName: name
    });
  }, []);

  return {
    location,
    requestRealGPS,
    setManualLocation,
    isWatching,
    setIsWatching
  };
}
