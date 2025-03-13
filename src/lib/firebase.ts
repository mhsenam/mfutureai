import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  enableIndexedDbPersistence,
  connectFirestoreEmulator,
} from "firebase/firestore";

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
  // Set a flag to ensure we only try to enable persistence once
  const persistenceEnabled = window.localStorage.getItem(
    "firestorePersistenceEnabled"
  );

  if (!persistenceEnabled) {
    enableIndexedDbPersistence(db)
      .then(() => {
        console.log("Firestore persistence enabled successfully");
        window.localStorage.setItem("firestorePersistenceEnabled", "true");
      })
      .catch((err) => {
        console.error("Error enabling Firestore persistence:", err);
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
}

// Connect to emulator if in development and using emulator
if (
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true"
) {
  const host = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || "localhost";
  const port = parseInt(
    process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT || "8080",
    10
  );
  connectFirestoreEmulator(db, host, port);
  console.log(`Connected to Firestore emulator at ${host}:${port}`);
}

export { app, auth, db };
