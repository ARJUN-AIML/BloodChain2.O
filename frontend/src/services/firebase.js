import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoApiKeyForBloodChainVerification123",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "bloodchain-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "bloodchain-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "bloodchain-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abc123def456"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export { signInWithEmailAndPassword, signOut };
