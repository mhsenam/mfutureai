import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  enableIndexedDbPersistence,
  connectFirestoreEmulator,
} from "firebase/firestore";
// 
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

// Enable offline persistence (wrap in try/catch as it can fail in some browsers)
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      console.warn(
        "Multiple tabs open, persistence can only be enabled in one tab at a time."
      );
    } else if (err.code === "unimplemented") {
      console.warn(
        "The current browser does not support all of the features required to enable persistence"
      );
    } else {
      console.error("Error enabling persistence:", err);
    }
  });
} catch (err) {
  console.error("Error setting up persistence:", err);
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

// Add this debug code to check if Firebase is initialized correctly
console.log("Firebase initialization status:", {
  apiKey: Boolean(firebaseConfig.apiKey),
  authDomain: Boolean(firebaseConfig.authDomain),
  projectId: Boolean(firebaseConfig.projectId),
  storageBucket: Boolean(firebaseConfig.storageBucket),
  messagingSenderId: Boolean(firebaseConfig.messagingSenderId),
  appId: Boolean(firebaseConfig.appId),
});

// Log when Firebase is initialized
console.log("Firebase app initialized:", Boolean(app));
console.log("Firebase auth initialized:", Boolean(auth));
console.log("Firebase db initialized:", Boolean(db));

export { app, auth, db };
