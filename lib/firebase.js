import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBzYESqyrFq5x5WvINkKa_FqkLvOAA6spk",
  authDomain: "recommendation-system-62a42.firebaseapp.com",
  projectId: "recommendation-system-62a42",
  storageBucket: "recommendation-system-62a42.appspot.com",
  messagingSenderId: "618231349247",
  appId: "1:618231349247:web:13c4111cdab136c0f1f1ca",
  measurementId: "G-EM4P1Z169L",
};

// Initialize Firebase app only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);
