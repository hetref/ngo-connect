// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA9lcOeGWoGi4CyW6lKWBiT9mlaX3R6cu8",
  authDomain: "aryandeveloperportfolio.firebaseapp.com",
  projectId: "aryandeveloperportfolio",
  storageBucket: "aryandeveloperportfolio.appspot.com",
  messagingSenderId: "967328598696",
  appId: "1:967328598696:web:3c5fbd4ebd97aed675109d",
  measurementId: "G-G17DS23S06",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
