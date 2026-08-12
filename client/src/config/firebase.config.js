import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC1N96H184BLapRVcd29Fiz44v7CNRoIyQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dragowar-7fb2c.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://dragowar-7fb2c.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dragowar-7fb2c",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dragowar-7fb2c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "596681841253",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:596681841253:web:8947ade5bf6185b526c48c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
