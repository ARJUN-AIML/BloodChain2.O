// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDbMwrUoDEqMw_X4Rm_ss_bAzxRqdN1GuU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "bloodchain-95960.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://bloodchain-95960-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "bloodchain-95960",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "bloodchain-95960.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "836624051781",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:836624051781:web:2ec7be72a04e317ab67d2c",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-7ZNRYWT6Y1"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Analytics safely (in browser environment if supported)
export let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((err) => {
    console.debug('Firebase Analytics initialization note:', err);
  });
}

export { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut };
export default app;
