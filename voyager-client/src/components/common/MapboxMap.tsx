import React, { useEffect, useRef, useState } from 'react';
import * as mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import automationService from '../../services/automationService';

interface MapboxMapProps {
  lat: number;
  lng: number;
  title: string;
  description?: string;
  showRoute?: boolean;          // draw a line between user location and target
  showTravelInfo?: boolean;     // display estimated travel hours overlay
  onLocationSelect?: (lat: number, lng: number, address?: string) => void;
}

const MapboxMap: React.FC<MapboxMapProps> = ({ lat, lng, title, description, showRoute = true, showTravelInfo = false, onLocationSelect }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [travelHours, setTravelHours] = useState<number | null>(null);

  // fetch token on mount
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const settings = await automationService.getSettings();
        if (settings.mapboxAccessToken) {
          setToken(settings.mapboxAccessToken);
          (window as any).mapboxToken = settings.mapboxAccessToken;
        } else {
          console.warn("Mapbox Access Token not found in settings");
          setIsLoading(false);
        }
      } catch (e) {
        console.error("Failed to fetch Mapbox Token", e);
        setIsLoading(false);
      }
    };
    fetchToken();
  }, []);

  // initialize map once token is available
  useEffect(() => {
    if (!token || !mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: 12,
      antialias: true,
      accessToken: token
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    new mapboxgl.Marker({ color: '#a78bfa' })
      .setLngLat([lng, lat])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="color: #1e293b; padding: 5px;">
          <strong style="display: block; font-size: 14px; margin-bottom: 4px;">${title}</strong>
          ${description ? `<p style="font-size: 12px; margin: 0; color: #64748b;">${description}</p>` : ''}
        </div>
      `))
      .addTo(map.current);
    map.current.on('load', () => {
      setIsLoading(false);

      if (showRoute && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (!map.current) return;
            const userLngLat: [number, number] = [position.coords.longitude, position.coords.latitude];

            new mapboxgl.Marker({ color: '#10b981', scale: 0.8 })
              .setLngLat(userLngLat)
              .setPopup(new mapboxgl.Popup().setText('Your Location'))
              .addTo(map.current);

            map.current.addSource('route', {
              'type': 'geojson',
              'data': {
                'type': 'Feature',
                'properties': {},
                'geometry': {
                  'type': 'LineString',
                  'coordinates': [userLngLat, [lng, lat]]
                }
              }
            });

            map.current.addLayer({
              'id': 'route',
              'type': 'line',
              'source': 'route',
              'layout': { 'line-join': 'round', 'line-cap': 'round' },
              'paint': {
                'line-color': '#a78bfa',
                'line-width': 4,
                'line-opacity': 0.7,
                'line-dasharray': [2, 1]
              }
            });

            const bounds = new mapboxgl.LngLatBounds()
              .extend(userLngLat)
              .extend([lng, lat]);
            map.current.fitBounds(bounds, { padding: 50 });

            if (showTravelInfo) {
              const toRad = (d: number) => d * Math.PI / 180;
              const R = 6371;
              const dLat = toRad(lat - userLngLat[1]);
              const dLon = toRad(lng - userLngLat[0]);
              const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(userLngLat[1])) * Math.cos(toRad(lat)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
              const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              setTravelHours(d / 50);
            }
          },
          (err) => console.warn("Geolocation failed", err)
        );
      }

      map.current?.on('click', (e) => {
        if (onLocationSelect) {
          onLocationSelect(e.lngLat.lat, e.lngLat.lng);
        }
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [token, showRoute, showTravelInfo, onLocationSelect, lat, lng, title, description]);

  // Handle dynamic coordinate changes without remounting
  useEffect(() => {
    if (!map.current || !token) return;

    map.current.flyTo({
      center: [lng, lat],
      essential: true,
      duration: 1500,
      zoom: 14
    });

    new mapboxgl.Marker({ color: '#a78bfa' })
      .setLngLat([lng, lat])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="color: #1e293b; padding: 5px;">
          <strong style="display: block; font-size: 14px; margin-bottom: 4px;">${title}</strong>
          ${description ? `<p style="font-size: 12px; margin: 0; color: #64748b;">${description}</p>` : ''}
        </div>
      `))
      .addTo(map.current);

  }, [lat, lng, title, description, token]);

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-10 text-white">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            Loading Mapbox...
          </div>
        </div>
      )}
      {!token && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-500 p-8 text-center italic">
          <span className="text-3xl mb-4">🗺️</span>
          Mapbox Access Token required.<br /><small>Please check system settings.</small>
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" style={{ minHeight: '400px' }} />
      {showTravelInfo && travelHours !== null && (
        <div className="absolute bottom-4 right-4 bg-slate-900/90 border border-purple-500/30 text-white p-3 rounded-xl shadow-2xl backdrop-blur-md anim-slide-up flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center text-xl">🚗</div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Estimated Travel</div>
            <div className="text-lg font-bold text-purple-400 font-mono">{travelHours.toFixed(1)} <span className="text-xs">hours</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapboxMap;
