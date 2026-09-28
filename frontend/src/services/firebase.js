// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  child, 
  push, 
  update, 
  remove, 
  onValue,
  serverTimestamp as rtdbServerTimestamp
} from "firebase/database";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  serverTimestamp as firestoreServerTimestamp
} from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firebase Realtime Database
export const database = getDatabase(app);
export const rtdb = database; // Convenient alias

// Initialize Cloud Firestore Database
export const db = getFirestore(app);
export const firestore = db; // Convenient alias

// Initialize Firebase Analytics safely (in browser environment if supported)
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

// Helper to test database connectivity
export const testDatabaseConnection = async () => {
  const status = {
    app: Boolean(app),
    database: false,
    firestore: false,
    timestamp: new Date().toISOString()
  };

  try {
    // Test RTDB connection with a read at root or .info/connected
    const connectedRef = ref(database, ".info/connected");
    const snapshot = await get(connectedRef);
    status.database = snapshot.exists() ? snapshot.val() : true;
  } catch (err) {
    status.databaseError = err.message;
  }

  try {
    // Firestore ping
    status.firestore = Boolean(db);
  } catch (err) {
    status.firestoreError = err.message;
  }

  console.log('[Firebase] Database connection status:', status);
  return status;
};

// Re-export SDK functions for convenient consumption across the app
export {
  // Auth
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,

  // Realtime Database
  ref,
  set,
  get,
  child,
  push,
  update,
  remove,
  onValue,
  rtdbServerTimestamp,

  // Cloud Firestore
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  firestoreServerTimestamp
};

export default app;
