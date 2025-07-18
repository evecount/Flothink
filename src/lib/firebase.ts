
import { initializeApp, getApps, getApp, type FirebaseOptions, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAnalytics, type Analytics } from "firebase/analytics";
import { getStorage, type Storage } from "firebase/storage";

// This configuration is now driven by environment variables for flexibility.
// Populate the .env file with the configuration from your Firebase project.
// Go to Project settings > General > Your apps > Firebase SDK snippet > Config.
export const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;
let storage: Storage | null = null;

// This is the primary configuration for the Flothink app.
// It is safe to delete any other web app registrations from the Firebase console.
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  console.log(`[Firebase] Initializing with projectId: ${firebaseConfig.projectId}. If sign-in fails, ensure this project ID matches the one in your Firebase console where you've enabled auth providers.`);
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }

    if (app) {
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
      if (typeof window !== "undefined") {
        try {
          analytics = getAnalytics(app);
        } catch (e) {
            console.warn("Could not initialize Firebase Analytics, this can happen in some environments.");
        }
      }
    }
  } catch(e) {
      console.error("Failed to initialize Firebase", e);
  }
} else {
    console.warn("Firebase configuration is missing. Please create or check your .env file with your project's credentials to connect to Firebase.");
}


export { app, auth, db, storage, analytics };
