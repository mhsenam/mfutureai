"use client";

import { useState, useEffect } from "react";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaDumbbell,
  FaRunning,
  FaHeartbeat,
  FaWeight,
  FaChevronLeft,
  FaChevronRight,
  FaCalendarDay,
  FaTimes,
  FaSignOutAlt,
} from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

// Define workout types
type WorkoutType = "strength" | "cardio" | "flexibility";

// Define workout entry interface
interface WorkoutEntry {
  id: string;
  date: string;
  type: WorkoutType;
  name: string;
  duration: number; // in minutes
  notes?: string;
}

// Define weight entry interface
interface WeightEntry {
  date: string;
  weight: number;
}

export default function FitnessTracker() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();

  // State for workout entries
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);

  // State for weight entries
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);

  // State for current month in calendar
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // State for active tab
  const [activeTab, setActiveTab] = useState<"workouts" | "weight">("workouts");

  // State for weight input
  const [weightInput, setWeightInput] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // State for form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<WorkoutEntry, "id">>({
    date: new Date().toISOString().split("T")[0],
    type: "strength",
    name: "",
    duration: 30,
    notes: "",
  });

  // Loading state
  const [loading, setLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser && !loading) {
      router.push("/login");
    }
  }, [currentUser, loading, router]);

  // Load data from Firestore
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);

    // Set up real-time listeners for workouts
    const workoutsRef = collection(db, "workouts");
    const workoutsQuery = query(
      workoutsRef,
      where("userId", "==", currentUser.uid)
    );

    const unsubscribeWorkouts = onSnapshot(workoutsQuery, (snapshot) => {
      const workoutData: WorkoutEntry[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        workoutData.push({
          id: doc.id,
          date: data.date,
          type: data.type as WorkoutType,
          name: data.name,
          duration: data.duration,
          notes: data.notes,
        });
      });
      setWorkouts(workoutData);
    });

    // Set up real-time listeners for weight entries
    const weightsRef = collection(db, "weights");
    const weightsQuery = query(
      weightsRef,
      where("userId", "==", currentUser.uid)
    );

    const unsubscribeWeights = onSnapshot(weightsQuery, (snapshot) => {
      const weightData: WeightEntry[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        weightData.push({
          date: data.date,
          weight: data.weight,
        });
      });
      setWeightEntries(weightData);
      setLoading(false);
    });

    return () => {
      unsubscribeWorkouts();
      unsubscribeWeights();
    };
  }, [currentUser]);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "duration" ? parseInt(value) || 0 : value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) return;

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

      // Reset form
      setFormData({
        date: new Date().toISOString().split("T")[0],
        type: "strength",
        name: "",
        duration: 30,
        notes: "",
      });
      setShowForm(false);
      setEditingId(null);
    } catch (error) {
      console.error("Error saving workout:", error);
    }
  };

  // Edit a workout
  const handleEdit = (workout: WorkoutEntry) => {
    setFormData({
      date: workout.date,
      type: workout.type,
      name: workout.name,
      duration: workout.duration,
      notes: workout.notes || "",
    });
    setEditingId(workout.id);
    setShowForm(true);
  };

  // Delete a workout
  const handleDelete = async (id: string) => {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, "workouts", id));
    } catch (error) {
      console.error("Error deleting workout:", error);
    }
  };

  // Handle weight submission
  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      console.error("No user is logged in");
      return;
    }

    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) {
      console.error("Invalid weight value:", weightInput);
      return;
    }

    try {
      console.log("Attempting to save weight:", {
        userId: currentUser.uid,
        date: selectedDate,
        weight: weight,
      });

      // Use the date as the document ID for easy updates
      const weightDocId = `${currentUser.uid}_${selectedDate}`;

      await setDoc(doc(db, "weights", weightDocId), {
        userId: currentUser.uid,
        date: selectedDate,
        weight: weight,
        updatedAt: new Date().toISOString(),
      });

      console.log("Weight saved successfully");

      // Reset input
      setWeightInput("");
    } catch (error) {
      console.error("Error saving weight:", error);
    }
  };

  // Clear weight for selected date
  const handleClearWeight = async () => {
    if (!currentUser) return;

    // Check if there's an entry for this date
    const hasEntry = weightEntries.some((entry) => entry.date === selectedDate);

    if (hasEntry) {
      try {
        const weightDocId = `${currentUser.uid}_${selectedDate}`;
        await deleteDoc(doc(db, "weights", weightDocId));
        setWeightInput("");
      } catch (error) {
        console.error("Error deleting weight:", error);
      }
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  // Function to jump to today's date
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today.toISOString().split("T")[0]);

    // Pre-fill weight input if there's an existing entry for today
    const todayString = today.toISOString().split("T")[0];
    const existingEntry = weightEntries.find(
      (entry) => entry.date === todayString
    );
    setWeightInput(existingEntry ? existingEntry.weight.toString() : "");
  };

  // Get icon based on workout type
  const getWorkoutIcon = (type: WorkoutType) => {
    switch (type) {
      case "strength":
        return <FaDumbbell className="text-blue-600" />;
      case "cardio":
        return <FaRunning className="text-red-600" />;
      case "flexibility":
        return <FaHeartbeat className="text-green-600" />;
    }
  };

  // Calendar functions
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const getDateString = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
  };

  const getWeightForDate = (dateString: string) => {
    const entry = weightEntries.find((entry) => entry.date === dateString);
    return entry ? entry.weight : null;
  };

  const handleDateClick = (day: number) => {
    const dateString = getDateString(day);
    setSelectedDate(dateString);

    // Pre-fill weight input if there's an existing entry
    const existingEntry = weightEntries.find(
      (entry) => entry.date === dateString
    );
    setWeightInput(existingEntry ? existingEntry.weight.toString() : "");
  };

  // Get weight trend data
  const getWeightTrend = () => {
    if (weightEntries.length < 2) return null;

    const sortedEntries = [...weightEntries].sort(
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
  };

  const weightTrend = getWeightTrend();

  // If still loading or not logged in, show loading state
  if (!currentUser || loading) {
    return (
      <div className="flex flex-col min-h-screen relative">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="dotted-pattern absolute inset-0" />
        </div>
        <main className="flex-grow flex flex-col items-center justify-center px-4 py-6 sm:p-8 relative z-10">
          <style jsx>{`
            .dotted-pattern {
              background-image: radial-gradient(#212529 1px, transparent 1px);
              background-size: 24px 24px;
              opacity: 0.1;
            }

            .calendar-day {
              aspect-ratio: 1 / 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              cursor: pointer;
              transition: all 0.2s;
            }

            .calendar-day:hover {
              background-color: rgba(59, 130, 246, 0.1);
            }

            .calendar-day.selected {
              background-color: rgba(59, 130, 246, 0.2);
              font-weight: bold;
            }

            .calendar-day.has-weight {
              border-bottom: 2px solid #3b82f6;
            }

            .weight-value {
              font-size: 0.7rem;
              color: #3b82f6;
            }

            ::placeholder {
              color: #495057;
              opacity: 1;
            }
          `}</style>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg">
            <div className="flex flex-col items-center">
              <div className="inline-block h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-700">Loading your fitness data...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Dotted pattern background - visible on all devices */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="dotted-pattern absolute inset-0" />
      </div>

      <main className="flex-grow flex flex-col items-center px-4 py-6 sm:p-8 relative z-10">
        <style jsx>{`
          .dotted-pattern {
            background-image: radial-gradient(#212529 1px, transparent 1px);
            background-size: 24px 24px;
            opacity: 0.1;
          }

          .calendar-day {
            aspect-ratio: 1 / 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            transition: all 0.2s;
          }

          .calendar-day:hover {
            background-color: rgba(59, 130, 246, 0.1);
          }

          .calendar-day.selected {
            background-color: rgba(59, 130, 246, 0.2);
            font-weight: bold;
          }

          .calendar-day.has-weight {
            border-bottom: 2px solid #3b82f6;
          }

          .weight-value {
            font-size: 0.7rem;
            color: #2563eb;
            font-weight: 500;
          }

          /* Improve placeholder color for better readability */
          ::placeholder {
            color: #495057;
            opacity: 1;
          }

          /* Improve text contrast */
          .text-contrast {
            text-shadow: 0 0 1px rgba(255, 255, 255, 0.5);
          }

          /* Add background to improve text visibility */
          .text-with-bg {
            background-color: rgba(255, 255, 255, 0.8);
            padding: 2px 4px;
            border-radius: 2px;
          }
        `}</style>

        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg w-full max-w-4xl mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
              Fitness Tracker
            </h1>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-sm text-gray-600">
                {currentUser.email}
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                aria-label="Sign out"
              >
                <FaSignOutAlt />{" "}
                <span className="hidden sm:inline">Sign Out</span>
              </button>
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-800 text-sm md:text-base"
              >
                Home
              </Link>
            </div>
          </div>
          <p className="text-sm md:text-base text-gray-900 mb-4 sm:mb-6 text-center">
            Track your workouts and monitor your fitness progress over time.
          </p>
        </div>

        {/* Tabs */}
        <div className="w-full max-w-4xl mb-6">
          <div className="flex border-b border-gray-200">
            <button
              className={`py-2 px-4 font-medium text-sm sm:text-base ${
                activeTab === "workouts"
                  ? "border-b-2 border-blue-600 text-blue-700"
                  : "text-gray-700 hover:text-gray-900"
              }`}
              onClick={() => setActiveTab("workouts")}
            >
              <span className="flex items-center gap-2">
                <FaDumbbell /> Workouts
              </span>
            </button>
            <button
              className={`py-2 px-4 font-medium text-sm sm:text-base ${
                activeTab === "weight"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("weight")}
            >
              <span className="flex items-center gap-2">
                <FaWeight /> Weight Tracker
              </span>
            </button>
          </div>
        </div>

        {activeTab === "workouts" ? (
          <>
            {/* Add Workout Button */}
            <div className="w-full max-w-4xl mb-6">
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FaPlus /> {showForm ? "Cancel" : "Add Workout"}
              </button>
            </div>

            {/* Add/Edit Workout Form */}
            {showForm && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg w-full max-w-4xl mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">
                  {editingId ? "Edit Workout" : "Add New Workout"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="date"
                        className="block text-sm font-medium text-gray-800 mb-1"
                      >
                        Date
                      </label>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="type"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Workout Type
                      </label>
                      <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="strength">Strength Training</option>
                        <option value="cardio">Cardio</option>
                        <option value="flexibility">
                          Flexibility & Mobility
                        </option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-1"
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
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="duration"
                        className="block text-sm font-medium text-gray-700 mb-1"
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
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="notes"
                      className="block text-sm font-medium text-gray-700 mb-1"
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
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      {editingId ? "Update Workout" : "Save Workout"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Workouts List */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg w-full max-w-4xl">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Your Workouts
              </h2>

              {workouts.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-700">
                    No workouts recorded yet. Start by adding your first
                    workout!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {workouts
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    )
                    .map((workout) => (
                      <div
                        key={workout.id}
                        className="border border-gray-300 rounded-lg p-4 bg-white/95 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-full">
                              {getWorkoutIcon(workout.type)}
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {workout.name}
                              </h3>
                              <p className="text-sm text-gray-700">
                                {new Date(workout.date).toLocaleDateString()} •{" "}
                                {workout.duration} minutes
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(workout)}
                              className="text-blue-700 hover:text-blue-900 p-1"
                              aria-label="Edit workout"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(workout.id)}
                              className="text-red-700 hover:text-red-900 p-1"
                              aria-label="Delete workout"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                        {workout.notes && (
                          <div className="mt-2 text-sm text-gray-800 border-t border-gray-100 pt-2">
                            {workout.notes}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Weight Tracker */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg w-full max-w-4xl mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Weight Calendar
                </h2>

                {weightTrend && (
                  <div className="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                    You have {weightTrend.direction}{" "}
                    {Math.abs(parseFloat(weightTrend.totalChange))}kg over{" "}
                    {weightTrend.period}
                  </div>
                )}
              </div>

              {/* Calendar Navigation */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <button
                    onClick={prevMonth}
                    className="p-2 text-gray-600 hover:text-gray-900"
                    aria-label="Previous month"
                  >
                    <FaChevronLeft />
                  </button>
                  <h3 className="text-lg font-medium text-gray-900 mx-2">
                    {formatMonthYear(currentMonth)}
                  </h3>
                  <button
                    onClick={nextMonth}
                    className="p-2 text-gray-600 hover:text-gray-900"
                    aria-label="Next month"
                  >
                    <FaChevronRight />
                  </button>
                </div>

                {/* Today button */}
                <button
                  onClick={goToToday}
                  className="flex items-center gap-1 text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
                >
                  <FaCalendarDay /> Today
                </button>
              </div>

              {/* Calendar */}
              <div className="mb-6">
                {/* Day names */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <div
                        key={day}
                        className="text-center text-sm font-medium text-gray-700 py-1"
                      >
                        {day}
                      </div>
                    )
                  )}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-1">
                  {generateCalendarDays().map((day, index) => {
                    if (day === null) {
                      return (
                        <div
                          key={`empty-${index}`}
                          className="calendar-day"
                        ></div>
                      );
                    }

                    const dateString = getDateString(day);
                    const weight = getWeightForDate(dateString);
                    const isSelected = dateString === selectedDate;

                    return (
                      <div
                        key={`day-${day}`}
                        className={`calendar-day border border-gray-300 rounded-md ${
                          isSelected ? "selected bg-blue-100" : ""
                        } ${weight ? "has-weight" : ""}`}
                        onClick={() => handleDateClick(day)}
                      >
                        <div className="text-gray-900">{day}</div>
                        {weight && (
                          <div className="weight-value text-blue-700 font-medium">
                            {weight}kg
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Weight Entry Form */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-md font-medium text-gray-900 mb-2">
                  Record Weight for{" "}
                  {new Date(selectedDate).toLocaleDateString()}
                </h3>
                <form onSubmit={handleWeightSubmit} className="flex gap-2">
                  <div className="flex-grow">
                    <input
                      type="number"
                      step="0.1"
                      min="20"
                      max="300"
                      value={weightInput}
                      onChange={(e) => setWeightInput(e.target.value)}
                      placeholder="Enter weight in kg"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleClearWeight}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <FaTimes size={14} /> Clear
                  </button>
                </form>
              </div>
            </div>

            {/* Weight History */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg w-full max-w-4xl">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Weight History
              </h2>

              {weightEntries.length === 0 ? (
                <div className="text-center py-8 text-gray-700 bg-gray-50 rounded-lg">
                  <p>
                    No weight entries yet. Use the calendar above to record your
                    weight.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {weightEntries
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    )
                    .map((entry, index) => {
                      // Calculate weight change if not the first entry
                      let change = null;
                      if (index < weightEntries.length - 1) {
                        const nextEntry = weightEntries.sort(
                          (a, b) =>
                            new Date(b.date).getTime() -
                            new Date(a.date).getTime()
                        )[index + 1];
                        change = entry.weight - nextEntry.weight;
                      }

                      return (
                        <div
                          key={entry.date}
                          className="flex justify-between items-center p-3 border-b border-gray-200 bg-white/90 rounded-md mb-1"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-full">
                              <FaWeight className="text-blue-700" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {entry.weight} kg
                              </p>
                              <p className="text-sm text-gray-700">
                                {new Date(entry.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {change !== null && (
                            <div
                              className={`text-sm font-medium ${
                                change < 0
                                  ? "text-green-700"
                                  : change > 0
                                  ? "text-red-700"
                                  : "text-gray-700"
                              }`}
                            >
                              {change < 0 ? "↓" : change > 0 ? "↑" : "="}
                              {Math.abs(change).toFixed(1)} kg
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-3 sm:py-4 bg-gray-100/80 backdrop-blur-sm border-t border-gray-200 mt-auto relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center">
            <p className="text-xs sm:text-sm text-gray-600 text-center">
              © {new Date().getFullYear()} MFuture AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
