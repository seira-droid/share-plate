import { useEffect, useRef, useState, useCallback } from 'react';
import { Listing, WebSocketEventPayload } from '../types';

interface UseRealtimeFeedProps {
  userId: string;
  lat: number;
  lng: number;
  radiusKm: number;
  onListingEvent?: (event: string, listing: Listing) => void;
}

export function useRealtimeFeed({
  userId,
  lat,
  lng,
  radiusKm,
  onListingEvent
}: UseRealtimeFeedProps) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastNotification, setLastNotification] = useState<{ event: string; title: string; time: Date } | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const onListingEventRef = useRef(onListingEvent);
  onListingEventRef.current = onListingEvent;

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // Determine WebSocket URL (protocol ws:// or wss://)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live-feed?user_id=${userId}`;

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        // Subscribe to current GPS position & radius filter
        socket.send(JSON.stringify({
          type: 'subscribe_location',
          lat,
          lng,
          radius_km: radiusKm
        }));
      };

      socket.onmessage = (event) => {
        try {
          const payload: WebSocketEventPayload = JSON.parse(event.data);
          
          if (payload.event && payload.data) {
            const listing = payload.data;
            let title = '';

            if (payload.event === 'listing_created') {
              title = `New food available: ${listing.food_name}!`;
            } else if (payload.event === 'listing_status_changed') {
              if (listing.status === 'ready') {
                title = `🍲 Freshly Ready: ${listing.food_name}!`;
              } else if (listing.status === 'sold_out') {
                title = `${listing.food_name} is now Sold Out`;
              } else if (listing.status === 'reserved') {
                title = `${listing.food_name} was just reserved`;
              } else {
                title = `${listing.food_name} status updated: ${listing.status}`;
              }
            } else if (payload.event === 'listing_reserved') {
              title = `Portion reserved: ${listing.food_name}`;
            } else if (payload.event === 'listing_cancelled') {
              title = `Reservation cancelled: ${listing.food_name} is back!`;
            }

            if (title) {
              setLastNotification({ event: payload.event, title, time: new Date() });
            }

            if (onListingEventRef.current) {
              onListingEventRef.current(payload.event, listing);
            }
          }
        } catch (e) {
          console.warn('Error parsing incoming WebSocket message:', e);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        // Auto-reconnect after 3 seconds
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      socket.onerror = (err) => {
        console.warn('WebSocket error, retrying...', err);
        socket.close();
      };

    } catch (e) {
      console.error('Failed to instantiate WebSocket:', e);
    }
  }, [userId, lat, lng, radiusKm]);

  // Keep subscription in sync when lat/lng/radiusKm changes
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe_location',
        lat,
        lng,
        radius_km: radiusKm
      }));
    }
  }, [lat, lng, radiusKm]);

  // Re-connect on mount / userId change
  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  // Heartbeat ping every 25 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);
    return () => clearInterval(interval);
  }, []);

  return { isConnected, lastNotification };
}

