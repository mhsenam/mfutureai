import React from "react";
import {
  FaEdit,
  FaTrash,
  FaDumbbell,
  FaRunning,
  FaHeartbeat,
} from "react-icons/fa";
import { useWorkouts } from "@/hooks/useWorkouts";

interface WorkoutEntry {
  id: string;
  date: string;
  type: "strength" | "cardio" | "flexibility";
  name: string;
  duration: number;
  notes?: string;
}

interface WorkoutListProps {
  workouts: WorkoutEntry[];
}

export default function WorkoutList({ workouts }: WorkoutListProps) {
  const { editWorkout, deleteWorkout } = useWorkouts();

  const getWorkoutIcon = (type: WorkoutEntry["type"]) => {
    switch (type) {
      case "strength":
        return <FaDumbbell className="text-blue-600 dark:text-blue-400" />;
      case "cardio":
        return <FaRunning className="text-red-600 dark:text-red-400" />;
      case "flexibility":
        return <FaHeartbeat className="text-green-600 dark:text-green-400" />;
    }
  };

  if (workouts.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 dark:bg-dark-lighter rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-700 dark:text-gray-300">
          No workouts recorded yet. Start by adding your first workout!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {workouts
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((workout) => (
          <div
            key={workout.id}
            className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-white/95 dark:bg-dark-primary/95 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-dark-lighter rounded-full">
                  {getWorkoutIcon(workout.type)}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {workout.name}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {new Date(workout.date).toLocaleDateString()} •{" "}
                    {workout.duration} minutes
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => editWorkout(workout)}
                  className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1"
                  aria-label="Edit workout"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => deleteWorkout(workout.id)}
                  className="text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1"
                  aria-label="Delete workout"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
            {workout.notes && (
              <div className="mt-2 text-sm text-gray-800 dark:text-gray-200 border-t border-gray-100 dark:border-gray-700 pt-2">
                {workout.notes}
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
