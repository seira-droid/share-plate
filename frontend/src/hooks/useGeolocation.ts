import { useState, useEffect, useCallback } from 'react';
import { GPSLocation } from '../types';

export const PRESET_LOCATIONS = [
  { name: 'Downtown Metro Center', lat: 40.7128, lng: -74.0060 },
  { name: 'Green Valley Suburb', lat: 40.7282, lng: -73.9942 },
  { name: 'West Riverside District', lat: 40.7061, lng: -74.0150 },
  { name: 'University Commons', lat: 40.7295, lng: -73.9965 },
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
