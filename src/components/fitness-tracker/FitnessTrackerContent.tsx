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
  addDoc,
  getDocs,
  orderBy,
  Timestamp,
  limit,
  enableNetwork,
  disableNetwork,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";

// Define WeightEntry interface directly here to avoid import issues
interface WeightEntry {
  id: string;
  weight: number;
  date: string;
}

// Create a simple WeightHistory component to avoid import issues
function WeightHistory({
  weightHistory,
  isLoading,
  error,
}: {
  weightHistory: WeightEntry[];
  isLoading: boolean;
  error: string | null;
}) {
  if (isLoading) {
    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-900">
          Weight History
        </h3>
        <div className="text-center py-4 flex items-center justify-center">
          <div className="inline-block h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
          <span>Loading your weight history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-900">
          Weight History
        </h3>
        <div className="text-center py-4 text-red-500 bg-red-50 rounded-md p-2">
          {error}
        </div>
      </div>
    );
  }

  if (weightHistory.length === 0) {
    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-900">
          Weight History
        </h3>
        <div className="text-center py-4 text-gray-600 bg-gray-50 rounded-md p-2">
          No weight entries yet. Start tracking today!
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-900">
        Weight History
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Weight (kg)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {weightHistory.map((entry) => (
              <tr key={entry.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(entry.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.weight}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add this state for success messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser && !isInitialLoading) {
      router.push("/login");
    }
  }, [currentUser, isInitialLoading, router]);

  // Load data from Firestore
  useEffect(() => {
    if (!currentUser) return;

    setIsInitialLoading(true);

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
          id: doc.id,
          weight: data.weight,
          date: data.date,
        });
      });
      setWeightEntries(weightData);
      setIsInitialLoading(false);
    });

    return () => {
      unsubscribeWorkouts();
      unsubscribeWeights();
    };
  }, [currentUser]);

  // Fetch user's weight history from Firebase when component mounts or user changes
  useEffect(() => {
    if (!currentUser) {
      setWeightEntries([]);
      setIsInitialLoading(false);
      return;
    }

    console.log("Current user changed, fetching weight history");

    // Use a one-time fetch instead of a real-time listener initially
    fetchWeightHistory();

    // Set up a more controlled real-time listener with error handling
    let unsubscribe: (() => void) | null = null;
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 5000; // 5 seconds

    const setupListener = async () => {
      try {
        // Check if we already have a listener
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }

        // Check network status first
        if (!navigator.onLine) {
          console.log("Device is offline, skipping real-time listener setup");
          return;
        }

        console.log("Setting up real-time listener for weight entries");

        const weightRef = collection(db, "weightEntries");
        const q = query(
          weightRef,
          where("userId", "==", currentUser.uid),
          orderBy("timestamp", "desc")
        );

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            console.log(
              "Real-time update received, snapshot size:",
              snapshot.size
            );

            const weightData: WeightEntry[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              try {
                weightData.push({
                  id: doc.id,
                  weight: parseFloat(data.weight) || 0,
                  date: data.date || "Unknown date",
                });
              } catch (err) {
                console.error(
                  "Error parsing weight entry in real-time update:",
                  err,
                  data
                );
              }
            });

            console.log(
              "Updated weight entries from real-time listener:",
              weightData.length
            );
            setWeightEntries(weightData);
            setIsInitialLoading(false);

            // Reset retry count on successful update
            retryCount = 0;
          },
          (error) => {
            console.error("Error in real-time listener:", error);

            // If we have network issues, try to recover
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(
                `Listener error, retrying (${retryCount}/${maxRetries}) in ${
                  retryDelay / 1000
                }s...`
              );

              // Clean up the current listener
              if (unsubscribe) {
                unsubscribe();
                unsubscribe = null;
              }

              // Try to reset the Firebase connection
              handleFirebaseConnectionIssue().then(() => {
                // Set a timeout before retrying
                setTimeout(setupListener, retryDelay);
              });
            } else {
              console.log(
                "Max retries exceeded, falling back to manual fetching"
              );
              setError(
                `Real-time updates unavailable: ${error.message}. Using manual updates instead.`
              );
              setIsInitialLoading(false);
            }
          }
        );
      } catch (err) {
        console.error("Failed to set up real-time listener:", err);
        setIsInitialLoading(false);
      }
    };

    // Initial setup
    setupListener();

    // Set up a periodic refresh as a fallback
    const refreshInterval = setInterval(() => {
      if (navigator.onLine) {
        console.log("Performing periodic refresh of weight data");
        fetchWeightHistory(true);
      }
    }, 60000); // Refresh every minute

    // Clean up function
    return () => {
      if (unsubscribe) {
        console.log("Cleaning up real-time listener");
        unsubscribe();
      }
      clearInterval(refreshInterval);
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

  // Update the handleFirebaseConnectionIssue function to use a different approach
  const handleFirebaseConnectionIssue = async () => {
    try {
      console.log("Attempting to fix Firebase connection...");

      // First, disable the network to reset connections
      await disableNetwork(db);
      console.log("Network disabled");

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Then re-enable it
      await enableNetwork(db);
      console.log("Network re-enabled");

      return true;
    } catch (err) {
      console.error("Failed to reset Firebase connection:", err);
      return false;
    }
  };

  // Update the handleWeightSubmit function to handle errors better
  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setError("You must be logged in to save weight data");
      return;
    }

    if (!weightInput || !selectedDate) {
      setError("Please enter both weight and date");
      return;
    }

    // Validate weight is a number
    const weightValue = parseFloat(weightInput);
    if (isNaN(weightValue) || weightValue <= 0) {
      setError("Please enter a valid weight value");
      return;
    }

    // Set loading state to true
    setIsSaving(true);
    setError(null);

    // Create the weight entry object with all required fields
    const newWeightEntry = {
      userId: currentUser.uid,
      weight: weightValue,
      date: selectedDate, // Store as string for easier querying
      timestamp: Timestamp.fromDate(new Date(selectedDate)), // Also store as Timestamp for ordering
      createdAt: Timestamp.now(),
    };

    let retryCount = 0;
    const maxRetries = 2;

    const attemptSave = async () => {
      try {
        console.log(
          `Saving weight entry (attempt ${retryCount + 1}):`,
          newWeightEntry
        );

        // IMPORTANT: Using "weightEntries" collection consistently
        const weightRef = collection(db, "weightEntries");

        // Use addDoc to add the document to the collection
        const docRef = await addDoc(weightRef, newWeightEntry);
        console.log("Document written with ID:", docRef.id);

        // Clear form
        setWeightInput("");
        setSelectedDate(new Date().toISOString().split("T")[0]);

        // Set success message
        setSuccessMessage("Weight saved successfully!");

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);

        return true;
      } catch (err) {
        console.error(
          `Error saving weight entry (attempt ${retryCount + 1}):`,
          err
        );

        // Check if it's a network error
        if (
          err instanceof FirebaseError &&
          (err.code === "failed-precondition" ||
            err.code === "unavailable" ||
            err.code.includes("network"))
        ) {
          console.log(
            "Network error detected, attempting to fix connection..."
          );

          // Try to fix the connection
          const connectionFixed = await handleFirebaseConnectionIssue();

          // If we fixed the connection and haven't exceeded max retries, try again
          if (connectionFixed && retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying save (attempt ${retryCount + 1})...`);
            return await attemptSave();
          }
        }

        // If we get here, we've either exceeded retries or it's not a network error
        setError(
          `Failed to save your weight entry: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
        return false;
      }
    };

    try {
      await attemptSave();
    } finally {
      // IMPORTANT: Always reset the loading state, even if there's an error
      setIsSaving(false);
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

  // Add this function outside of any other function but inside the component
  const fetchWeightHistory = async (forceRefresh = false) => {
    if (!currentUser) {
      setWeightEntries([]);
      return;
    }

    // Use the appropriate loading state
    if (forceRefresh) {
      setIsFetching(true);
    } else if (isInitialLoading) {
      // Keep initial loading state
    } else {
      setIsFetching(true);
    }

    setError(null);

    try {
      console.log("Fetching weight history for user:", currentUser.uid);

      // IMPORTANT: Make sure we're using the correct collection name
      const weightRef = collection(db, "weightEntries");

      // Create a query against the collection
      const q = query(
        weightRef,
        where("userId", "==", currentUser.uid),
        orderBy("timestamp", "desc") // Use timestamp field for ordering
      );

      console.log("Executing Firestore query...");
      const querySnapshot = await getDocs(q);
      console.log("Query snapshot size:", querySnapshot.size);

      const weightData: WeightEntry[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log("Document data:", doc.id, data);

        try {
          weightData.push({
            id: doc.id,
            weight: parseFloat(data.weight) || 0,
            date: data.date || "Unknown date",
          });
        } catch (err) {
          console.error("Error parsing weight entry:", err, data);
        }
      });

      console.log("Fetched weight entries:", weightData.length, weightData);

      // Update state with the fetched data
      setWeightEntries(weightData);
    } catch (err) {
      console.error("Error fetching weight history:", err);
      setError(
        `Failed to load your weight history: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setIsInitialLoading(false);
      setIsFetching(false);
    }
  };

  // Add a function to verify Firebase connection
  const verifyFirebaseConnection = async () => {
    try {
      // Try to get a document from Firestore to verify connection
      const testRef = collection(db, "test");
      await getDocs(query(testRef, limit(1)));
      console.log("Firebase connection verified successfully");
      return true;
    } catch (err) {
      console.error("Firebase connection error:", err);
      return false;
    }
  };

  // Call this function when the component mounts
  useEffect(() => {
    verifyFirebaseConnection();
  }, []);

  // Add a function to check network status
  const checkNetworkStatus = () => {
    return navigator.onLine;
  };

  // Add this useEffect to monitor network status
  useEffect(() => {
    const handleOnline = () => {
      console.log("Device is online");
      // Re-enable Firestore network
      enableNetwork(db).catch((err) =>
        console.error("Failed to enable network:", err)
      );
    };

    const handleOffline = () => {
      console.log("Device is offline");
      // Disable Firestore network to prevent unnecessary retries
      disableNetwork(db).catch((err) =>
        console.error("Failed to disable network:", err)
      );

      // Show an error if we're in the middle of saving
      if (isSaving) {
        setError(
          "You are offline. Please check your internet connection and try again."
        );
        setIsSaving(false);
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isSaving]);

  // Add a reset function to clear any stuck states
  const resetStates = () => {
    setIsSaving(false);
    setIsInitialLoading(false);
    setIsFetching(false);
    setError(null);
    setSuccessMessage(null);
  };

  // Add a function to manually refresh data
  const manualRefresh = async () => {
    if (!currentUser) return;

    console.log("Manual refresh requested");
    await fetchWeightHistory(true);
    setSuccessMessage("Data refreshed successfully!");

    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  // If still loading or not logged in, show loading state
  if (!currentUser || isInitialLoading) {
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
                      disabled={isSaving}
                    />
                  </div>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                      isSaving
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <div className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </button>
                </form>
                {error && (
                  <div className="text-red-500 text-sm mt-2 bg-red-50 p-2 rounded-md">
                    <p>{error}</p>
                    {!checkNetworkStatus() && (
                      <p className="mt-1">
                        You appear to be offline. Please check your internet
                        connection.
                      </p>
                    )}
                    <button
                      onClick={() => {
                        resetStates();
                        handleFirebaseConnectionIssue();
                      }}
                      className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-md text-xs"
                    >
                      Reset Connection & Try Again
                    </button>
                  </div>
                )}
                {successMessage && (
                  <p className="text-green-500 text-sm mt-2 bg-green-50 p-2 rounded-md">
                    {successMessage}
                  </p>
                )}
              </div>

              {/* Weight History */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Weight History
                </h2>
                <button
                  onClick={manualRefresh}
                  disabled={isFetching}
                  className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors flex items-center gap-1"
                >
                  {isFetching ? (
                    <>
                      <div className="inline-block h-3 w-3 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
                      Refreshing...
                    </>
                  ) : (
                    "Refresh Data"
                  )}
                </button>
              </div>
              <WeightHistory
                weightHistory={weightEntries}
                isLoading={isInitialLoading || isFetching}
                error={error}
              />
            </div>
          </>
        )}

        {/* Debug Information */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-3 bg-gray-100 rounded-md text-xs">
            <h4 className="font-bold mb-1">Debug Info:</h4>
            <p>isSaving: {isSaving ? "true" : "false"}</p>
            <p>isLoading: {isInitialLoading ? "true" : "false"}</p>
            <p>isFetching: {isFetching ? "true" : "false"}</p>
            <p>User ID: {currentUser?.uid || "Not logged in"}</p>
            <p>Weight Entries: {weightEntries.length}</p>
            <p>Network Status: {checkNetworkStatus() ? "Online" : "Offline"}</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  console.log("Current state:", {
                    isSaving,
                    isInitialLoading,
                    isFetching,
                    currentUser,
                    weightEntries,
                  });
                }}
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
              >
                Log State
              </button>
              <button
                onClick={resetStates}
                className="px-2 py-1 bg-red-500 text-white rounded text-xs"
              >
                Reset States
              </button>
              <button
                onClick={handleFirebaseConnectionIssue}
                className="px-2 py-1 bg-green-500 text-white rounded text-xs"
              >
                Reset Connection
              </button>
            </div>
          </div>
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
