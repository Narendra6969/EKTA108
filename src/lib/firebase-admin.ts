
import admin from 'firebase-admin';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

// This function ensures the Firebase Admin SDK is initialized only once.
function getAdminDb(): Firestore {
  if (admin.apps.length === 0) {
    console.log("Initializing Firebase Admin SDK...");
    try {
      const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (!serviceAccountString) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set or is empty.");
      }
      
      const serviceAccount = JSON.parse(serviceAccountString);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: "acciassist",
        storageBucket: "acciassist.appspot.com"
      });
      console.log("Firebase Admin SDK initialized successfully.");
    } catch (error: any) {
        console.error("Firebase Admin SDK initialization error:", error);
        // Instead of throwing an error and crashing, we log a warning and continue in a "mock" mode.
        // This is safer for a development/prototyping environment.
        console.warn("--------------------------------------------------------------------");
        console.warn("WARNING: Firebase Admin SDK initialization failed.");
        console.warn(`Reason: ${error.message}`);
        console.warn("The application will continue in a 'mock' or 'degraded' mode.");
        console.warn("Backend actions requiring admin privileges (like saving reports) will not work.");
        console.warn("To fix this, ensure the FIREBASE_SERVICE_ACCOUNT environment variable is set correctly.");
        console.warn("--------------------------------------------------------------------");

        // Return a mock object that won't crash when its methods are called.
        // This prevents the entire app from failing.
        return {
          collection: () => ({
            doc: () => ({
              set: () => Promise.resolve(),
              get: () => Promise.resolve({ exists: false }),
              collection: () => ({
                add: () => Promise.resolve({ id: 'mock-id' }),
              }),
            }),
            add: () => Promise.resolve({ id: 'mock-id' }),
          }),
        } as unknown as Firestore;
    }
  }
  return getFirestore();
}

export { getAdminDb };
