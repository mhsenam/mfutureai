import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// Your Firebase configuration
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
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable offline persistence when possible
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      console.log(
        "Multiple tabs open, persistence can only be enabled in one tab at a time."
      );
    } else if (err.code === "unimplemented") {
      console.log(
        "The current browser does not support all of the features required to enable persistence"
      );
    }
  });
}

export { app, auth, db };
