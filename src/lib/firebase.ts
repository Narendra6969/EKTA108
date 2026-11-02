
"use client";

import { createContext, useContext } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { Auth } from "firebase/auth";

// Your web app's Firebase configuration
// Now loaded from environment variables
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

type FirebaseContextType = {
  auth: Auth;
  db: Firestore;
  app: FirebaseApp;
};

export const FirebaseContext = createContext<FirebaseContextType | null>(null);

export const useFirebase = () => {
    const context = useContext(FirebaseContext);
    if (!context) {
        throw new Error("useFirebase must be used within a FirebaseProvider");
    }
    return context;
};

export const useFirebaseAuth = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error("useFirebaseAuth must be used within a FirebaseProvider");
  }
  return context.auth;
}

export const useFirebaseDb = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error("useFirebaseDb must be used within a FirebaseProvider");
  }
  return context.db;
}
