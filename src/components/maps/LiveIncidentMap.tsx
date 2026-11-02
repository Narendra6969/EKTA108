
"use client";

import React, { useEffect, useRef, useState } from 'react';
import L, { type LatLngExpression, type Map as LeafletMapInstance } from 'leaflet';
import { useFirebaseDb } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import type { PublicAccidentReport } from '@/lib/types';
import { Siren } from 'lucide-react';

const MAP_CONTAINER_ID_INCIDENT = 'ekta-leaflet-home-incident-map';
const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_CSS_INTEGRITY = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';

const MAP_DEFAULT_CENTER: LatLngExpression = [20.5937, 78.9629]; // India center
const MAP_DEFAULT_ZOOM = 4;

if (typeof window !== 'undefined') {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

const incidentIcon = L.divIcon({
  html: `<div style="background-color: hsl(var(--destructive) / 0.8); border: 2px solid white; border-radius: 50%; padding: 4px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.3); animation: pulse-red 2s infinite;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-siren"><path d="M7 12a5 5 0 0 1 5-5v0a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5v0a5 5 0 0 1-5-5Z"/><path d="M5 20a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v0Z"/><path d="M12 4v3"/><path d="M12 12v0"/><path d="m15 9-1-1"/><path d="m9 9 1-1"/></svg></div>
  <style>@keyframes pulse-red { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; } }</style>`,
  className: '', // No default Leaflet classes
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});


const LiveIncidentMap = React.memo(function LiveIncidentMapComponent() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletMapInstance | null>(null);
  const incidentMarkersRef = useRef<L.Marker[]>([]);
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
          scrollWheelZoom: false, // Better for a homepage display
          zoomControl: false,
        });
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        }).addTo(map);
        mapInstanceRef.current = map;
      } catch (error) {
        console.error("[LiveIncidentMap] Error initializing map:", error);
      }
    }

    const q = query(collection(db, "accidentReports"), orderBy("timestamp", "desc"), limit(15));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const reports: PublicAccidentReport[] = [];
      querySnapshot.forEach((doc) => {
        reports.push({ id: doc.id, ...doc.data() } as PublicAccidentReport);
      });

      const map = mapInstanceRef.current;
      if (!map) return;

      // Clear existing markers
      incidentMarkersRef.current.forEach(marker => marker.removeFrom(map));
      incidentMarkersRef.current = [];

      // Add new markers for incidents
      reports.forEach(report => {
        if (report.latitude && report.longitude) {
          const position: LatLngExpression = [report.latitude, report.longitude];
          const newMarker = L.marker(position, { icon: incidentIcon }).addTo(map);
          incidentMarkersRef.current.push(newMarker);
        }
      });

    }, (error) => {
      console.error("Error fetching live incident reports:", error);
    });

    return () => {
      unsubscribe();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [db]);

  return (
    <div
      id={MAP_CONTAINER_ID_INCIDENT}
      ref={mapContainerRef}
      style={{ height: '450px', width: '100%' }}
      className="bg-muted rounded-lg border overflow-hidden"
    />
  );
});
LiveIncidentMap.displayName = 'LiveIncidentMap';

export default LiveIncidentMap;
