import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import automationService from '../../services/automationService';

interface MapboxMapProps {
  lat: number;
  lng: number;
  title: string;
  description?: string;
  showRoute?: boolean;
  showTravelInfo?: boolean;
  onLocationSelect?: (lat: number, lng: number, address?: string) => void;
}

const MapboxMap: React.FC<MapboxMapProps> = ({ lat, lng, title, description, showRoute = true, showTravelInfo = false, onLocationSelect }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapPortalContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalExpanded, setIsModalExpanded] = useState(false);
  const [travelHours, setTravelHours] = useState<number | null>(null);
  const userLocationRef = useRef<[number, number] | null>(null);

  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const onSelectRef = useRef(onLocationSelect);
  useEffect(() => { onSelectRef.current = onLocationSelect; }, [onLocationSelect]);

  // Fetch token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const settings = await automationService.getSettings();
        const rawToken = (settings as any).mapboxAccessToken ?? (settings as any).MapboxAccessToken ?? '';
        const normalizedToken = typeof rawToken === 'string' ? rawToken.trim() : '';

        if (!normalizedToken) {
          setTokenError("Missing Mapbox Access Token.");
          setIsLoading(false);
          return;
        }

        (mapboxgl as any).accessToken = normalizedToken;
        (window as any).mapboxToken = normalizedToken;
        setToken(normalizedToken);
      } catch (e) {
        setTokenError("Failed to fetch map settings.");
        setIsLoading(false);
      }
    };
    fetchToken();
  }, []);

  // Initialize Map
  useEffect(() => {
    const container = isModalExpanded ? mapPortalContainer.current : mapContainer.current;
    if (!token || !container) return;

    // Clean up previous map if container changes
    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    try {
      const mapInstance = new mapboxgl.Map({
        container: container,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lng, lat],
        zoom: isModalExpanded ? 14 : 12,
        antialias: true,
      });

      map.current = mapInstance;

      mapInstance.on('load', () => {
        setIsLoading(false);
        mapInstance.resize();

        // Initial Marker
        const marker = new mapboxgl.Marker({ color: '#a78bfa' })
          .setLngLat([lng, lat])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="color: #1e293b; padding: 5px;">
              <strong style="display: block; font-size: 14px; margin-bottom: 4px;">${title}</strong>
              ${description ? `<p style="font-size: 11px; margin: 0; color: #64748b;">${description}</p>` : ''}
            </div>
          `))
          .addTo(mapInstance);
        
        markerRef.current = marker;

        // Geolocation & Route
        if (showRoute && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            if (!map.current) return;
            const userLoc: [number, number] = [pos.coords.longitude, pos.coords.latitude];
            userLocationRef.current = userLoc;
            new mapboxgl.Marker({ color: '#10b981', scale: 0.8 }).setLngLat(userLoc).addTo(map.current);
            
            try {
              map.current.addSource('route', {
                type: 'geojson',
                data: {
                  type: 'Feature',
                  properties: {},
                  geometry: { type: 'LineString', coordinates: [userLoc, [lng, lat]] }
                }
              });
              map.current.addLayer({
                id: 'route', type: 'line', source: 'route',
                paint: { 'line-color': '#a78bfa', 'line-width': 4, 'line-opacity': 0.7, 'line-dasharray': [2, 1] }
              });
            } catch (err) {}

            if (showTravelInfo) {
              const toRad = (d: number) => d * Math.PI / 180;
              const dLat = toRad(lat - userLoc[1]);
              const dLon = toRad(lng - userLoc[0]);
              const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(userLoc[1])) * Math.cos(toRad(lat)) * Math.sin(dLon/2) * Math.sin(dLon/2);
              const d = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              setTravelHours(d / 50);
            }
          });
        }
      });

      mapInstance.on('click', (e) => {
        if (onSelectRef.current) {
          onSelectRef.current(e.lngLat.lat, e.lngLat.lng);
        }
      });

    } catch (e) {
      console.error("Map initialization failed", e);
      setIsLoading(false);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        markerRef.current = null;
      }
    };
  }, [token, isModalExpanded]); // ONLY re-init on token or expansion change

  // Sync Marker & View
  useEffect(() => {
    if (!map.current || !token) return;

    // Move marker if it exists
    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
    }

    // Fly to new position
    map.current.flyTo({
      center: [lng, lat],
      essential: true,
      zoom: map.current.getZoom()
    });

    // Keep route/travel estimate in sync when destination changes.
    const userLoc = userLocationRef.current;
    if (showRoute && userLoc) {
      const routeSource = map.current.getSource('route') as mapboxgl.GeoJSONSource | undefined;
      const routeData = {
        type: 'Feature' as const,
        properties: {},
        geometry: { type: 'LineString' as const, coordinates: [userLoc, [lng, lat]] }
      };
      if (routeSource) {
        routeSource.setData(routeData);
      }

      if (showTravelInfo) {
        const toRad = (d: number) => d * Math.PI / 180;
        const dLat = toRad(lat - userLoc[1]);
        const dLon = toRad(lng - userLoc[0]);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
          + Math.cos(toRad(userLoc[1])) * Math.cos(toRad(lat))
          * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const d = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        setTravelHours(d / 50);
      }
    }
  }, [lat, lng, token, showRoute, showTravelInfo]);

  const isCoordsValid = !isNaN(lat) && lat >= -90 && lat <= 90 && !isNaN(lng) && lng >= -180 && lng <= 180;

  const renderMapContent = () => (
    <div className={`relative w-full h-full bg-slate-900 rounded-xl border border-white/10 overflow-hidden`}>

      {/* Toggle Layout Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); setIsModalExpanded(!isModalExpanded); }}
        className="absolute top-4 right-4 z-[50] w-10 h-10 flex items-center justify-center bg-slate-900/90 hover:bg-purple-600 backdrop-blur-md border border-white/10 rounded-2xl text-white transition-all shadow-2xl group"
      >
        {isModalExpanded ? (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 3v5H3M16 3v5h5M16 21v-5h5M8 21v-5H3" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 15v6h-6M3 9V3h6" /></svg>
        )}
      </button>

      {isLoading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/90 backdrop-blur-md">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
        </div>
      )}

      {tokenError && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-900 text-slate-400 p-6 text-center">
          <span className="text-4xl mb-4">⚠️</span>
          <p>{tokenError}</p>
        </div>
      )}

      {token && !isCoordsValid && !isLoading && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-900 text-slate-400 p-6 text-center">
          <span className="text-4xl mb-4">📍</span>
          <p>Invalid coordinates: {lat.toFixed(4)}, {lng.toFixed(4)}</p>
        </div>
      )}

      <div ref={isModalExpanded ? mapPortalContainer : mapContainer} className="w-full h-full" style={{ minHeight: isModalExpanded ? '100%' : '435px' }} />


      {showTravelInfo && travelHours !== null && (
        <div className="absolute bottom-6 right-6 z-30 bg-slate-900/95 border border-purple-500/30 text-white p-4 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-4 anim-slide-up">
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-2xl">🚗</div>
          <div>
            <div className="text-[10px] text-purple-300 uppercase tracking-widest font-black">Travel Est.</div>
            <div className="text-2xl font-black">{travelHours.toFixed(1)} <span className="text-xs opacity-50">HRS</span></div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Normal View */}
      <div className={`w-full h-full ${isModalExpanded ? 'hidden' : 'block'}`}>
        {renderMapContent()}
      </div>

      {/* Expanded Modal View via Portal */}
      {isModalExpanded && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 sm:p-12">
          <div className="absolute inset-0 bg-black/1000 backdrop-blur-lg animate-fade-in" onClick={() => setIsModalExpanded(false)} />
          <div className="relative w-[95%] h-[90vh] max-w-11xl animate-scale-in">
            {renderMapContent()}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default MapboxMap;
