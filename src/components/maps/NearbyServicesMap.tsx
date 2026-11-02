
"use client";

import React, { useEffect, useRef } from 'react';
import L, { type LatLngExpression, type Map as LeafletMapInstance, type Marker as LeafletMarker } from 'leaflet';
import type { Hospital } from '@/lib/types';

const MAP_CONTAINER_ID_NEARBY = 'ekta-leaflet-nearby-map';
const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_CSS_INTEGRITY = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';

interface NearbyServicesMapProps {
  userPosition: LatLngExpression;
  hospitals: Hospital[];
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

// Custom icon for the user's location
const userIcon = L.divIcon({
  html: `<div style="background-color: hsl(var(--primary)); border: 2px solid white; border-radius: 50%; width: 16px; height: 16px; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Custom icon for hospitals
const hospitalIcon = L.divIcon({
    html: `<div style="background-color: hsl(var(--destructive)); border-radius: 50%; padding: 5px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2);"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hospital"><path d="M12 6v4"/><path d="M14 14h-4"/><path d="M14 18v-4"/><path d="M14 10h-4"/><path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2"/><path d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18"/></svg></div>`,
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13]
});


const NearbyServicesMap = React.memo(function NearbyServicesMapComponent({
  userPosition,
  hospitals,
}: NearbyServicesMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletMapInstance | null>(null);

  // Effect to load Leaflet CSS once
  useEffect(() => {
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

  // Effect to initialize and clean up the map instance
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    if (mapContainerRef.current.id === MAP_CONTAINER_ID_NEARBY && !mapInstanceRef.current) {
      try {
        const map = L.map(mapContainerRef.current.id).setView(userPosition, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        mapInstanceRef.current = map;
      } catch (error) {
        console.error("[NearbyServicesMap] Error initializing map:", error);
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only on mount/unmount

  // Effect to update markers and map view when data changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userPosition) return;
    
    // Clear existing markers
    map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    // Add user marker
    L.marker(userPosition, { icon: userIcon }).addTo(map).bindPopup("Your Location");

    // Add hospital markers
    const hospitalMarkers = hospitals
        .filter(h => h.latitude && h.longitude)
        .map(h => L.marker([h.latitude!, h.longitude!], { icon: hospitalIcon }).addTo(map).bindPopup(`<b>${h.name}</b><br>${h.address || ''}`));
    
    // Adjust map bounds to fit all markers
    const allPositions: LatLngExpression[] = [userPosition];
    hospitals.forEach(h => {
        if(h.latitude && h.longitude) {
            allPositions.push([h.latitude, h.longitude]);
        }
    });
    
    if (allPositions.length > 1) {
        const bounds = L.latLngBounds(allPositions);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    } else {
        map.setView(userPosition, 13);
    }

  }, [userPosition, hospitals]);

  return (
    <div
      id={MAP_CONTAINER_ID_NEARBY}
      ref={mapContainerRef}
      style={{ height: '400px', width: '100%' }}
      className="bg-muted rounded-md border overflow-hidden"
    />
  );
});
NearbyServicesMap.displayName = 'NearbyServicesMap';

export default NearbyServicesMap;
