import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";

interface WeightEntry {
  id: string;
  weight: number;
  date: string;
}

interface WorkoutEntry {
  id: string;
  date: string;
  type: "strength" | "cardio" | "flexibility";
  name: string;
  duration: number;
  notes?: string;
}

interface FirebaseDataState {
  weightEntries: WeightEntry[];
  workouts: WorkoutEntry[];
  isLoading: boolean;
  error: string | null;
}

export function useFirebaseData() {
  const { currentUser } = useAuth();
  const [state, setState] = useState<FirebaseDataState>({
    weightEntries: [],
    workouts: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!currentUser) {
      setState((prev) => ({
        ...prev,
        weightEntries: [],
        workouts: [],
        isLoading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    // Set up real-time listeners for workouts
    const workoutsRef = collection(db, "workouts");
    const workoutsQuery = query(
      workoutsRef,
      where("userId", "==", currentUser.uid),
      orderBy("date", "desc")
    );

    const weightsRef = collection(db, "weightEntries");
    const weightsQuery = query(
      weightsRef,
      where("userId", "==", currentUser.uid),
      orderBy("timestamp", "desc")
    );

    const unsubscribeWorkouts = onSnapshot(
      workoutsQuery,
      (snapshot) => {
        const workoutData: WorkoutEntry[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          workoutData.push({
            id: doc.id,
            date: data.date,
            type: data.type,
            name: data.name,
            duration: data.duration,
            notes: data.notes,
          });
        });
        setState((prev) => ({ ...prev, workouts: workoutData }));
      },
      (error) => {
        console.error("Error fetching workouts:", error);
        setState((prev) => ({ ...prev, error: error.message }));
      }
    );

    const unsubscribeWeights = onSnapshot(
      weightsQuery,
      (snapshot) => {
        const weightData: WeightEntry[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          weightData.push({
            id: doc.id,
            weight: data.weight,
            date: data.date,
          });
        });
        setState((prev) => ({
          ...prev,
          weightEntries: weightData,
          isLoading: false,
          error: null,
        }));
      },
      (error) => {
        console.error("Error fetching weights:", error);
        setState((prev) => ({
          ...prev,
          error: error.message,
          isLoading: false,
        }));
      }
    );

    return () => {
      unsubscribeWorkouts();
      unsubscribeWeights();
    };
  }, [currentUser]);

  return state;
}
