import { useState, useCallback } from "react";
import { collection, addDoc, setDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

type WorkoutType = "strength" | "cardio" | "flexibility";

interface WorkoutEntry {
  id: string;
  date: string;
  type: WorkoutType;
  name: string;
  duration: number;
  notes?: string;
}

interface WorkoutFormData {
  date: string;
  type: WorkoutType;
  name: string;
  duration: number;
  notes: string;
}

export function useWorkouts() {
  const { currentUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<WorkoutFormData>({
    date: new Date().toISOString().split("T")[0],
    type: "strength",
    name: "",
    duration: 30,
    notes: "",
  });

  const resetForm = useCallback(() => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      type: "strength",
      name: "",
      duration: 30,
      notes: "",
    });
    setEditingId(null);
    setShowForm(false);
  }, []);

  const handleInputChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: name === "duration" ? parseInt(value) || 0 : value,
      }));
    },
    []
  );

  const saveWorkout = useCallback(async () => {
    if (!currentUser) return false;

    try {
      if (editingId) {
        // Update existing workout
        await setDoc(doc(db, "workouts", editingId), {
          ...formData,
          userId: currentUser.uid,
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Add new workout
        const newWorkoutRef = doc(collection(db, "workouts"));
        await setDoc(newWorkoutRef, {
          ...formData,
          userId: currentUser.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      resetForm();
      return true;
    } catch (error) {
      console.error("Error saving workout:", error);
      return false;
    }
  }, [currentUser, editingId, formData, resetForm]);

  const editWorkout = useCallback((workout: WorkoutEntry) => {
    setFormData({
      date: workout.date,
      type: workout.type,
      name: workout.name,
      duration: workout.duration,
      notes: workout.notes || "",
    });
    setEditingId(workout.id);
    setShowForm(true);
  }, []);

  const deleteWorkout = useCallback(
    async (id: string) => {
      if (!currentUser) return false;

      try {
        await deleteDoc(doc(db, "workouts", id));
        return true;
      } catch (error) {
        console.error("Error deleting workout:", error);
        return false;
      }
    },
    [currentUser]
  );

  return {
    showForm,
    setShowForm,
    editingId,
    formData,
    handleInputChange,
    saveWorkout,
    editWorkout,
    deleteWorkout,
    resetForm,
  };
}
