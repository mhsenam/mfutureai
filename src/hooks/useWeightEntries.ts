import { useState, useCallback } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

interface WeightEntry {
  id: string;
  weight: number;
  date: string;
}

interface WeightTrend {
  totalChange: string;
  direction: "lost" | "gained" | "maintained";
  period: string;
}

export function useWeightEntries() {
  const { currentUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const saveWeight = useCallback(
    async (weight: number, date: string) => {
      if (!currentUser) {
        setError("You must be logged in to save weight data");
        return false;
      }

      if (!weight || !date) {
        setError("Please enter both weight and date");
        return false;
      }

      if (isNaN(weight) || weight <= 0) {
        setError("Please enter a valid weight value");
        return false;
      }

      setIsSaving(true);
      setError(null);

      const saveTimeout = setTimeout(() => {
        if (isSaving) {
          setIsSaving(false);
          setError("Save operation timed out. Please try again.");
        }
      }, 10000);

      try {
        const weightRef = collection(db, "weightEntries");
        const newWeightEntry = {
          userId: currentUser.uid,
          weight,
          date,
          timestamp: Timestamp.fromDate(new Date(date)),
          createdAt: Timestamp.now(),
        };

        await addDoc(weightRef, newWeightEntry);

        setSuccessMessage("Weight saved successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);

        return true;
      } catch (err) {
        console.error("Error saving weight entry:", err);
        setError(
          `Failed to save your weight entry: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
        return false;
      } finally {
        clearTimeout(saveTimeout);
        setIsSaving(false);
      }
    },
    [currentUser, isSaving]
  );

  const calculateWeightTrend = useCallback(
    (entries: WeightEntry[]): WeightTrend | null => {
      if (entries.length < 2) return null;

      const sortedEntries = [...entries].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const firstEntry = sortedEntries[0];
      const lastEntry = sortedEntries[sortedEntries.length - 1];
      const weightDiff = lastEntry.weight - firstEntry.weight;
      const daysDiff = Math.round(
        (new Date(lastEntry.date).getTime() -
          new Date(firstEntry.date).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      return {
        totalChange: weightDiff.toFixed(1),
        direction:
          weightDiff < 0 ? "lost" : weightDiff > 0 ? "gained" : "maintained",
        period: daysDiff > 1 ? `${daysDiff} days` : "1 day",
      };
    },
    []
  );

  const getWeightForDate = useCallback(
    (entries: WeightEntry[], dateString: string): number | null => {
      const entry = entries.find((entry) => entry.date === dateString);
      return entry ? entry.weight : null;
    },
    []
  );

  return {
    isSaving,
    error,
    successMessage,
    saveWeight,
    calculateWeightTrend,
    getWeightForDate,
    setError,
    setSuccessMessage,
  };
}
