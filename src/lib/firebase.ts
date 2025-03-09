import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

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
const analytics = getAnalytics(app);

// Log the configuration (without sensitive data)
console.log("Firebase initialized with project:", firebaseConfig.projectId);

// Enable offline persistence
enableIndexedDbPersistence(db)
  .then(() => {
    console.log("Firestore persistence enabled");
  })
  .catch((err) => {
    console.error("Error enabling persistence:", err);
    if (err.code === "failed-precondition") {
      console.warn(
        "Multiple tabs open, persistence can only be enabled in one tab at a time"
      );
    } else if (err.code === "unimplemented") {
      console.warn(
        "The current browser does not support all of the features required to enable persistence"
      );
    }
  });

export { auth, db, analytics };
