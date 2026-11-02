
"use client";

import React, { useEffect, useRef } from 'react';
import L, { type LatLngExpression, type Map as LeafletMapInstance, type Marker as LeafletMarker } from 'leaflet';
// Leaflet CSS is now dynamically loaded in useEffect

const MAP_CONTAINER_ID_PREFIX = 'ekta-leaflet-map-container';
const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_CSS_INTEGRITY = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';

interface LeafletMapDisplayProps {
  defaultCenter: LatLngExpression;
  defaultZoom: number;
  mapContainerStyle: React.CSSProperties;
  currentPosition?: LatLngExpression | null;
  trackingZoom?: number;
}

if (typeof window !== 'undefined') {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

const LeafletMapDisplay = React.memo(function LeafletMapDisplayComponent({
  defaultCenter,
  defaultZoom,
  mapContainerStyle,
  currentPosition,
  trackingZoom,
}: LeafletMapDisplayProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletMapInstance | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const mapIdRef = useRef<string>(`${MAP_CONTAINER_ID_PREFIX}-${Math.random().toString(36).substring(2, 9)}`);


  useEffect(() => {
    // Dynamically load Leaflet CSS
    let linkElement: HTMLLinkElement | null = document.querySelector(`link[href="${LEAFLET_CSS_URL}"]`);
    if (!linkElement) {
      linkElement = document.createElement('link');
      linkElement.rel = 'stylesheet';
      linkElement.href = LEAFLET_CSS_URL;
      linkElement.integrity = LEAFLET_CSS_INTEGRITY;
      linkElement.crossOrigin = '';
      document.head.appendChild(linkElement);
    }
  }, []);


  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) {
      return;
    }

    if (!mapInstanceRef.current && mapContainerRef.current) {
      try {
        mapInstanceRef.current = L.map(mapIdRef.current, {
          center: defaultCenter,
          zoom: defaultZoom,
          scrollWheelZoom: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapInstanceRef.current);

      } catch (error) {
        console.error("[LeafletMapDisplay] Error during map initialization:", error);
      }
    }

    return () => {
      if (markerRef.current && mapInstanceRef.current?.hasLayer(markerRef.current)) {
        markerRef.current.removeFrom(mapInstanceRef.current);
        markerRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [defaultCenter, defaultZoom]); 

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && currentPosition && trackingZoom) {
      map.setView(currentPosition, trackingZoom);
      if (!markerRef.current) {
        markerRef.current = L.marker(currentPosition).addTo(map);
      } else {
        markerRef.current.setLatLng(currentPosition);
      }
    } else if (map && markerRef.current && !currentPosition) {
      if (map.hasLayer(markerRef.current)) {
        markerRef.current.removeFrom(map);
      }
      markerRef.current = null;
    }
  }, [currentPosition, trackingZoom]);

  return (
    <div
      id={mapIdRef.current}
      ref={mapContainerRef}
      style={mapContainerStyle}
      className="bg-muted rounded-md border overflow-hidden" 
    />
  );
});
LeafletMapDisplay.displayName = 'LeafletMapDisplay';

export default LeafletMapDisplay;
