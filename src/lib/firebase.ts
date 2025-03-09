import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCA06jo0H8Wu0xSAALuACyE_KPi3Fymddo",
  authDomain: "mfuture-fitness-tracker.firebaseapp.com",
  projectId: "mfuture-fitness-tracker",
  storageBucket: "mfuture-fitness-tracker.firebasestorage.app",
  messagingSenderId: "687477977627",
  appId: "1:687477977627:web:69317840be542ca60dfebe",
  measurementId: "G-HHV2SR90R6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
