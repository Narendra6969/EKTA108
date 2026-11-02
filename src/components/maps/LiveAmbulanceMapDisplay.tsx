
"use client";

import React, { useEffect, useRef, useState } from 'react';
import L, { type LatLngExpression, type Map as LeafletMapInstance, type Marker as LeafletMarkerInstance } from 'leaflet';
import { useFirebaseDb } from '@/lib/firebase';
import { collection, onSnapshot, query, Timestamp } from 'firebase/firestore';
import type { LiveAmbulanceLocation } from '@/lib/types';
import { MapPin, AmbulanceIcon as AmbulanceIconLucide } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const MAP_CONTAINER_ID_HOSPITAL = 'ekta-leaflet-hospital-live-map';
const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_CSS_INTEGRITY = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';

const MAP_DEFAULT_CENTER: LatLngExpression = [20.5937, 78.9629]; // India center
const MAP_DEFAULT_ZOOM = 5;

interface AmbulanceMarker {
  id: string;
  marker: LeafletMarkerInstance;
  lastUpdate: Timestamp;
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

const ambulanceIcon = L.divIcon({
  html: `<div style="background-color: hsl(var(--primary)); border-radius: 50%; padding: 5px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2);"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary-foreground))" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ambulance"><path d="M10 10H6"/><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.684-.949V8a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1v1.188a1 1 0 0 1-.684.949l-1.923.641A1 1 0 0 0 12 13.72V17a1 1 0 0 0 1 1h2"/><path d="M8 8v4"/><path d="M9 18a1 1 0 0 0 1-1v-4h-3v4a1 1 0 0 0 1 1Z"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg></div>`,
  className: '', // No default Leaflet classes
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
});


const LiveAmbulanceMapDisplay = React.memo(function LiveAmbulanceMapDisplayComponent() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletMapInstance | null>(null);
  const ambulanceMarkersRef = useRef<AmbulanceMarker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAmbulances, setActiveAmbulances] = useState(0);
  const db = useFirebaseDb();

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

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) {
      return;
    }

    if (mapContainerRef.current && !mapInstanceRef.current) {
      try {
        const map = L.map(mapContainerRef.current, {
          center: MAP_DEFAULT_CENTER,
          zoom: MAP_DEFAULT_ZOOM,
          scrollWheelZoom: true,
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        mapInstanceRef.current = map;
      } catch (error) {
        console.error("[LiveAmbulanceMapDisplay] Error initializing map:", error);
      }
    }

    const q = query(collection(db, "liveAmbulanceLocations"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setIsLoading(false);
      const newLocations: LiveAmbulanceLocation[] = [];
      querySnapshot.forEach((doc) => {
        newLocations.push({ ambulanceId: doc.id, ...doc.data() } as LiveAmbulanceLocation);
      });

      setActiveAmbulances(newLocations.length);
      const map = mapInstanceRef.current;
      if (!map) return;

      const currentMarkers = ambulanceMarkersRef.current;
      const updatedMarkers: AmbulanceMarker[] = [];
      
      // Remove markers for ambulances that are no longer present
      currentMarkers.forEach(existingMarker => {
        if (!newLocations.find(loc => loc.ambulanceId === existingMarker.id)) {
          existingMarker.marker.removeFrom(map);
        }
      });

      newLocations.forEach(loc => {
        const existingMarker = currentMarkers.find(m => m.id === loc.ambulanceId);
        const position: LatLngExpression = [loc.latitude, loc.longitude];
        
        if (existingMarker) {
          existingMarker.marker.setLatLng(position);
          existingMarker.lastUpdate = loc.lastUpdate;
          existingMarker.marker.getPopup()?.setContent(`<b>Ambulance ID:</b> ${loc.ambulanceId}<br/><b>Last Update:</b> ${loc.lastUpdate.toDate().toLocaleTimeString()}`);
          updatedMarkers.push(existingMarker);
        } else {
          const newMarkerInstance = L.marker(position, { icon: ambulanceIcon })
            .addTo(map)
            .bindPopup(`<b>Ambulance ID:</b> ${loc.ambulanceId}<br/><b>Last Update:</b> ${loc.lastUpdate.toDate().toLocaleTimeString()}`);
          updatedMarkers.push({ id: loc.ambulanceId, marker: newMarkerInstance, lastUpdate: loc.lastUpdate });
        }
      });
      ambulanceMarkersRef.current = updatedMarkers;

    }, (error) => {
      console.error("Error fetching live ambulance locations:", error);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [db]); // Run once on mount, and re-run if db instance changes

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Loading map and ambulance data..." : 
            activeAmbulances > 0 ? `Tracking ${activeAmbulances} active ambulance(s). Click marker for details.` : "No active ambulances being tracked currently."}
        </p>
         {activeAmbulances > 0 && <Badge variant="secondary" className="bg-green-100 text-green-700"><AmbulanceIconLucide className="h-4 w-4 mr-1.5" /> {activeAmbulances} Active</Badge>}
      </div>
      <div
        id={MAP_CONTAINER_ID_HOSPITAL}
        ref={mapContainerRef}
        style={{ height: '400px', width: '100%' }}
        className="bg-muted rounded-md border overflow-hidden"
      />
    </div>
  );
});
LiveAmbulanceMapDisplay.displayName = 'LiveAmbulanceMapDisplay';

export default LiveAmbulanceMapDisplay;
