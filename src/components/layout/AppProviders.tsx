
"use client";

import type React from 'react';
import { useEffect } from 'react';

// This component can be expanded to include context providers, query client, etc.
export default function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('EKTA108 Service Worker registered with scope:', registration.scope);
        }).catch(error => {
          console.error('EKTA108 Service Worker registration failed:', error);
        });
      });
    }
  }, []);

  return <>{children}</>;
}
