
"use client";

import React from 'react';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from "firebase/auth";
import { firebaseConfig, FirebaseContext } from '@/lib/firebase';

// This component ensures Firebase is initialized once on the client-side
// and provides the initialized services through context.

export default function FirebaseProvider({ children }: { children: React.ReactNode }) {
  // Initialize Firebase client-side
  let app: FirebaseApp | null = null;
  let db: Firestore | null = null;
  let auth: Auth | null = null;

  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase client initialization error:", error);
  }
  
  return (
    <FirebaseContext.Provider value={{ app: app as any, db: db as any, auth: auth as any }}>
      {children}
    </FirebaseContext.Provider>
  );
}
