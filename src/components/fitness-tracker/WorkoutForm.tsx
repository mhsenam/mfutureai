import React from "react";
import { useWorkouts } from "@/hooks/useWorkouts";

export default function WorkoutForm() {
  const { showForm, formData, handleInputChange, saveWorkout, editingId } =
    useWorkouts();

  if (!showForm) return null;

  return (
    <div className="bg-white/90 dark:bg-dark-primary/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg w-full max-w-4xl mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
        {editingId ? "Edit Workout" : "Add New Workout"}
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveWorkout();
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1"
            >
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-lighter dark:text-gray-100"
              required
            />
          </div>
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
            >
              Workout Type
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-lighter dark:text-gray-100"
              required
            >
              <option value="strength">Strength Training</option>
              <option value="cardio">Cardio</option>
              <option value="flexibility">Flexibility & Mobility</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
            >
              Workout Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Upper Body, 5K Run, Yoga"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-lighter dark:text-gray-100"
              required
            />
          </div>
          <div>
            <label
              htmlFor="duration"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
            >
              Duration (minutes)
            </label>
            <input
              type="number"
              id="duration"
              name="duration"
              min="1"
              max="300"
              value={formData.duration}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-lighter dark:text-gray-100"
              required
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
          >
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            placeholder="Add any notes about your workout..."
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-dark-lighter dark:text-gray-100"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {editingId ? "Update Workout" : "Save Workout"}
          </button>
        </div>
      </form>
    </div>
  );
}
