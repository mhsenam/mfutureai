"use client";

declare const process: {
  env: {
    NODE_ENV: string;
  };
};

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaDumbbell,
  FaRunning,
  FaHeartbeat,
  FaChevronLeft,
  FaChevronRight,
  FaCalendarDay,
  FaSignOutAlt,
} from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../lib/firebase";
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
  updateDoc,
  getDoc,
  writeBatch,
} from "firebase/firestore";
import toast from "react-hot-toast";

// Add import for NotificationSettings
import NotificationSettings from "./NotificationSettings";

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
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
          Weight History
        </h3>
        <div className="text-center py-4 flex items-center justify-center">
          <div className="inline-block h-6 w-6 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin mr-2"></div>
          <span className="text-gray-700 dark:text-gray-300">
            Loading your weight history...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
          Weight History
        </h3>
        <div className="text-center py-4 text-red-500 bg-red-50 dark:bg-red-900/30 dark:text-red-300 rounded-md p-2">
          {error}
        </div>
      </div>
    );
  }

  if (weightHistory.length === 0) {
    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
          Weight History
        </h3>
        <div className="text-center py-4 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-dark-lighter/50 rounded-md p-2">
          No weight entries yet. Start tracking today!
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
        Weight History
      </h3>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-dark-lighter">
            <tr>
              <th
                scope="col"
                className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/3"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/3"
              >
                Weight (kg)
              </th>
              <th
                scope="col"
                className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/3"
              >
                Change
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-dark-primary divide-y divide-gray-200 dark:divide-gray-700">
            {weightHistory.map((entry, index) => {
              const prevEntry =
                index < weightHistory.length - 1
                  ? weightHistory[index + 1]
                  : null;
              const weightChange = prevEntry
                ? (entry.weight - prevEntry.weight).toFixed(1)
                : null;
              const isGain = weightChange && parseFloat(weightChange) > 0;
              const isLoss = weightChange && parseFloat(weightChange) < 0;

              return (
                <tr
                  key={entry.id}
                  className="hover:bg-gray-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                    {new Date(entry.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-gray-100 font-semibold">
                    {entry.weight} kg
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right">
                    {weightChange ? (
                      <span
                        className={`inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isGain
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            : isLoss
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {isGain ? "+" : ""}
                        {weightChange} kg
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
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

// Define PillReminder interface
interface PillReminder {
  id: string;
  name: string;
  frequency: "daily" | "weekly" | "specific_date";
  time: string;
  daysOfWeek?: string[];
  specificDate?: string | null;
  userId: string;
  createdAt: string;
  notificationEmail: string;
  sendNotifications: boolean;
  // New fields for Telegram
  telegramChatId?: string;
  useTelegramNotifications: boolean;
}

// Define TelegramBot interface for bot history
interface TelegramBot {
  id: string;
  botToken: string;
  botName: string;
  chatId?: string;
  username?: string;
  createdAt: string;
  isActive: boolean;
}

// Add this new interface for pill history
interface PillHistoryEntry {
  id: string;
  pillId: string;
  userId: string;
  action: "taken" | "skip" | "snooze";
  timestamp: { toDate: () => Date } | null; // Firestore timestamp
  telegramUserId?: string;
}

// Add this new component
function PillHistoryComponent({
  pillHistory,
  pills,
  isLoading,
}: {
  pillHistory: PillHistoryEntry[];
  pills: PillReminder[];
  isLoading: boolean;
}) {
  // Create a map of pill IDs to names for easy lookup
  const pillMap = new Map(pills.map((pill) => [pill.id, pill.name]));

  // Group history by date
  const historyByDate = pillHistory.reduce((acc, entry) => {
    // Convert Firestore timestamp to Date
    const date = entry.timestamp?.toDate
      ? entry.timestamp.toDate()
      : new Date();
    const dateStr = date.toISOString().split("T")[0];

    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }

    acc[dateStr].push(entry);
    return acc;
  }, {} as Record<string, PillHistoryEntry[]>);

  // Sort dates in reverse chronological order
  const sortedDates = Object.keys(historyByDate).sort((a, b) =>
    b.localeCompare(a)
  );

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Loading pill history...
        </p>
      </div>
    );
  }

  if (pillHistory.length === 0) {
    return (
      <div className="p-4 text-center border border-gray-200 dark:border-gray-700 rounded-lg">
        <p className="text-gray-600 dark:text-gray-400">
          No pill history available yet.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
          Your medication history will appear here once you start taking your
          pills.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
        Medication History
      </h3>

      {sortedDates.map((dateStr) => (
        <div
          key={dateStr}
          className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
        >
          <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">
              {new Date(dateStr).toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h4>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {historyByDate[dateStr].map((entry) => (
              <div
                key={entry.id}
                className="px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center">
                  {entry.action === "taken" && (
                    <span className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-green-600 dark:text-green-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  )}
                  {entry.action === "skip" && (
                    <span className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-orange-600 dark:text-orange-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  )}
                  {entry.action === "snooze" && (
                    <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-blue-600 dark:text-blue-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  )}

                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {pillMap.get(entry.pillId) || "Unknown Medication"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {entry.timestamp?.toDate
                        ? entry.timestamp
                            .toDate()
                            .toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                        : "Unknown time"}
                    </p>
                  </div>
                </div>

                <div>
                  <span
                    className={`text-sm px-2 py-1 rounded-full ${
                      entry.action === "taken"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                        : entry.action === "skip"
                        ? "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400"
                        : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400"
                    }`}
                  >
                    {entry.action === "taken"
                      ? "Taken"
                      : entry.action === "skip"
                      ? "Skipped"
                      : "Snoozed"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FitnessTrackerContent() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();

  // Refs for managing timers
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const retryTimer = useRef<NodeJS.Timeout | null>(null);

  // Store all active Firebase listeners
  const activeListeners = useRef<Array<() => void>>([]);

  // Function to register a listener for cleanup
  const registerListener = (unsubscribe: () => void) => {
    activeListeners.current.push(unsubscribe);
    return unsubscribe;
  };

  // Function to unsubscribe all listeners
  const unsubscribeAllListeners = () => {
    console.log(
      `Cleaning up ${activeListeners.current.length} active Firebase listeners`
    );
    activeListeners.current.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch (error) {
        console.error("Error unsubscribing listener:", error);
      }
    });
    activeListeners.current = [];
  };

  // State for workout entries
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);

  // State for weight entries
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);

  // State for current month in calendar
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // State for active tab
  const [activeTab, setActiveTab] = useState<"workouts" | "weight" | "pills">(
    "workouts"
  );

  // State for weight input
  const [weightInput, setWeightInput] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Add state for pills
  const [pills, setPills] = useState<PillReminder[]>([]);
  const [showPillForm, setShowPillForm] = useState(false);
  const [pillFormData, setPillFormData] = useState<Omit<PillReminder, "id">>({
    name: "",
    frequency: "daily",
    time: "09:00",
    daysOfWeek: [],
    specificDate: null,
    userId: currentUser?.uid || "",
    createdAt: new Date().toISOString(),
    notificationEmail: currentUser?.email || "",
    sendNotifications: true,
    useTelegramNotifications: false,
  });

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

  // Add these state variables for the modal
  const [showModal, setShowModal] = useState(false);
  const [modalDate, setModalDate] = useState<string>("");
  const [modalWeight, setModalWeight] = useState<string>("");

  // Add these new state variables for long press functionality
  const [longPressActive, setLongPressActive] = useState<number | null>(null);
  const [longPressProgress, setLongPressProgress] = useState<number>(0);
  const longPressDuration = 2000; // 2 seconds in milliseconds
  const longPressInterval = 50; // Update progress every 50ms

  // Add this state to your component
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Add this state
  const [firebaseReady, setFirebaseReady] = useState(false);

  // Add state for Telegram connection
  const [telegramConnecting, setTelegramConnecting] = useState(false);

  // Add state for Telegram bot history
  const [telegramBots, setTelegramBots] = useState<TelegramBot[]>([]);
  const [showBotHistory, setShowBotHistory] = useState(false);

  // Add these new state variables for pill history
  const [pillHistory, setPillHistory] = useState<PillHistoryEntry[]>([]);
  const [isPillHistoryLoading, setIsPillHistoryLoading] = useState(false);

  // Effect to handle auth state changes
  useEffect(() => {
    if (!currentUser) {
      // User has logged out, clean up listeners
      console.log("User logged out, cleaning up listeners");
      unsubscribeAllListeners();
    }
  }, [currentUser]);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser && !isInitialLoading) {
      router.push("/login");
    }
  }, [currentUser, isInitialLoading, router]);

  // Load data from Firestore
  useEffect(() => {
    if (!currentUser) {
      // Clean up any existing data when user is not authenticated
      setWeightEntries([]);
      setWorkouts([]);
      setIsInitialLoading(false);
      return;
    }

    setIsInitialLoading(true);

    // Set up real-time listeners for workouts
    const workoutsRef = collection(db, "workouts");
    const workoutsQuery = query(
      workoutsRef,
      where("userId", "==", currentUser.uid)
    );

    const unsubscribeWorkouts = registerListener(
      onSnapshot(workoutsQuery, (snapshot) => {
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
      })
    );

    // Set up real-time listeners for weight entries
    const weightsRef = collection(db, "weightEntries");
    const weightsQuery = query(
      weightsRef,
      where("userId", "==", currentUser.uid)
    );

    const unsubscribeWeights = registerListener(
      onSnapshot(weightsQuery, (snapshot) => {
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
      })
    );

    return () => {
      // We don't need to explicitly call these anymore as they're registered
      // in activeListeners and will be cleaned up in unsubscribeAllListeners
      unsubscribeWorkouts();
      unsubscribeWeights();
    };
  }, [currentUser]);

  // Fetch user's weight history from Firebase when component mounts or user changes
  useEffect(() => {
    // Clear state immediately if no user
    if (!currentUser) {
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
      }
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

        unsubscribe = registerListener(
          onSnapshot(
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
          )
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
      // We can call unsubscribe here or let unsubscribeAllListeners handle it
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

    // Set a timeout to automatically reset the saving state if it takes too long
    const saveTimeout = setTimeout(() => {
      if (isSaving) {
        setIsSaving(false);
        setError("Save operation timed out. Please try again.");
      }
    }, 10000); // 10 seconds timeout

    try {
      // Remove the connection test as it's causing issues
      // Just proceed with saving directly like in handleModalSubmit

      console.log("Saving weight entry:", {
        weight: weightValue,
        date: selectedDate,
        userId: currentUser.uid,
      });

      // IMPORTANT: Using "weightEntries" collection consistently
      const weightRef = collection(db, "weightEntries");

      // Create the weight entry object with all required fields
      const newWeightEntry = {
        userId: currentUser.uid,
        weight: weightValue,
        date: selectedDate,
        timestamp: Timestamp.fromDate(new Date(selectedDate)),
        createdAt: Timestamp.now(),
      };

      // Use addDoc to add the document to the collection
      const docRef = await addDoc(weightRef, newWeightEntry);
      console.log("Document written with ID:", docRef.id);

      // Clear form
      setWeightInput("");

      // Set success message
      setSuccessMessage("Weight saved successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);

      // Manually refresh the weight history to show the new entry
      fetchWeightHistory(true);
    } catch (err) {
      console.error("Error saving weight entry:", err);

      // More detailed error message based on the type of error
      let errorMessage = "Failed to save your weight entry: ";

      if (err instanceof Error) {
        errorMessage += err.message;

        // Check for specific Firebase error codes
        if (err.message.includes("permission-denied")) {
          errorMessage +=
            ". You may not have permission to write to this collection.";
        } else if (err.message.includes("unavailable")) {
          errorMessage +=
            ". Firebase service is currently unavailable. Please check your internet connection.";
        } else if (err.message.includes("not-found")) {
          errorMessage += ". The specified database path does not exist.";
        } else if (err.message.includes("network-request-failed")) {
          errorMessage +=
            ". Network error. Please check your internet connection.";

          // Try to reset the connection
          handleFirebaseConnectionIssue().then(() => {
            console.log(
              "Attempted to reset Firebase connection after network error"
            );
          });
        }
      } else {
        errorMessage += "Unknown error";
      }

      setError(errorMessage);
    } finally {
      // IMPORTANT: Always reset the loading state, even if there's an error
      clearTimeout(saveTimeout);
      setIsSaving(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      // First clean up all Firebase listeners
      console.log("Cleaning up Firebase listeners before logout");
      unsubscribeAllListeners();

      // Short delay to ensure listeners are cleaned up
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Then disable all Firebase network connections to prevent permission errors
      console.log("Disabling Firebase network connections before logout");
      await disableNetwork(db);

      // Then perform the logout
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Failed to log out", error);
      // Re-enable network in case of error
      await enableNetwork(db);
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

  // Update the handleDateClick function to work on both mobile and desktop
  const handleDateClick = (day: number) => {
    const dateString = getDateString(day);
    setSelectedDate(dateString);

    // Pre-fill weight input if there's an existing entry
    const existingEntry = weightEntries.find(
      (entry) => entry.date === dateString
    );

    // Update the form fields for both mobile and desktop
    setWeightInput(existingEntry ? existingEntry.weight.toString() : "");
  };

  // Update the handleDayMouseDown function to handle both click and long press
  const handleDayMouseDown = (day: number) => {
    if (window.innerWidth < 768) return; // Only for desktop

    // First, handle the click to select the day
    handleDateClick(day);

    // Then set up the long press
    setLongPressActive(day);
    setLongPressProgress(0);

    // Clear any existing timer
    if (longPressTimer.current) {
      clearInterval(longPressTimer.current);
    }

    // Start a new timer that updates progress
    let elapsed = 0;
    longPressTimer.current = setInterval(() => {
      elapsed += longPressInterval;
      const progress = Math.min((elapsed / longPressDuration) * 100, 100);
      setLongPressProgress(progress);

      // When we reach 100%, show the modal
      if (progress >= 100) {
        clearInterval(longPressTimer.current!);
        longPressTimer.current = null;

        // Show modal with the selected date
        const dateString = getDateString(day);

        // Pre-fill weight input if there's an existing entry
        const existingEntry = weightEntries.find(
          (entry) => entry.date === dateString
        );

        setModalDate(dateString);
        setModalWeight(existingEntry ? existingEntry.weight.toString() : "");
        setShowModal(true);

        // Reset long press state
        setLongPressActive(null);
        setLongPressProgress(0);
      }
    }, longPressInterval);
  };

  const handleDayMouseUp = () => {
    // Clear the timer when mouse is released
    if (longPressTimer.current) {
      clearInterval(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Reset long press state
    setLongPressActive(null);
    setLongPressProgress(0);
  };

  const handleDayMouseLeave = () => {
    // Clear the timer when mouse leaves the element
    if (longPressTimer.current) {
      clearInterval(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Reset long press state
    setLongPressActive(null);
    setLongPressProgress(0);
  };

  // Update the handleModalSubmit function with better error handling and state management
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setError("You must be logged in to save weight data");
      return;
    }

    if (!modalWeight) {
      setError("Please enter a weight value");
      return;
    }

    // Validate weight is a number
    const weightValue = parseFloat(modalWeight);
    if (isNaN(weightValue) || weightValue <= 0) {
      setError("Please enter a valid weight value");
      return;
    }

    setIsSaving(true);
    setError(null);

    // Set a timeout to automatically reset the saving state if it takes too long
    const saveTimeout = setTimeout(() => {
      if (isSaving) {
        setIsSaving(false);
        setError("Save operation timed out. Please try again.");
      }
    }, 10000); // 10 seconds timeout

    try {
      console.log("Saving weight entry from modal:", {
        weight: weightValue,
        date: modalDate,
        userId: currentUser.uid,
      });

      // IMPORTANT: Using "weightEntries" collection consistently
      const weightRef = collection(db, "weightEntries");

      // Create the weight entry object with all required fields
      const newWeightEntry = {
        userId: currentUser.uid,
        weight: weightValue,
        date: modalDate,
        timestamp: Timestamp.fromDate(new Date(modalDate)),
        createdAt: Timestamp.now(),
      };

      // Use addDoc to add the document to the collection
      const docRef = await addDoc(weightRef, newWeightEntry);
      console.log("Document written with ID:", docRef.id);

      // Set success message
      setSuccessMessage("Weight saved successfully!");

      // Update the selected date's weight input
      setWeightInput(weightValue.toString());

      // Close the modal after a short delay to show success message
      setTimeout(() => {
        setShowModal(false);

        // Clear success message after modal is closed
        setTimeout(() => {
          setSuccessMessage(null);
        }, 2000);
      }, 1000);

      // Manually refresh the weight history to show the new entry
      fetchWeightHistory(true);
    } catch (err) {
      console.error("Error saving weight entry from modal:", err);
      setError(
        `Failed to save your weight entry: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      // IMPORTANT: Always reset the loading state, even if there's an error
      clearTimeout(saveTimeout);
      setIsSaving(false);
    }
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
      setFirebaseReady(true);
      return true;
    } catch (err) {
      console.error("Firebase connection error:", err);
      setFirebaseReady(false);
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

  // Add these effects to monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

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

  // Clean up the interval on component unmount
  useEffect(() => {
    return () => {
      // Clean up all Firebase listeners
      unsubscribeAllListeners();

      // Clean up timers
      if (longPressTimer.current) {
        clearInterval(longPressTimer.current);
      }
    };
  }, []);

  // Add this function to help diagnose issues
  const debugFirebaseConnection = async () => {
    try {
      console.log("Testing Firebase connection...");

      // Check if Firebase is initialized
      if (!db) {
        throw new Error("Firebase database is not initialized");
      }

      // Try to write a test document
      const testCollection = collection(db, "connectionTests");
      const testDoc = {
        timestamp: Timestamp.now(),
        message: "Connection test",
        userId: currentUser?.uid || "anonymous",
      };

      console.log("Attempting to write test document...");
      const docRef = await addDoc(testCollection, testDoc);
      console.log("Test document written successfully with ID:", docRef.id);

      // Try to read the document back
      console.log("Attempting to read test document...");
      const testQuery = query(
        testCollection,
        where("userId", "==", currentUser?.uid || "anonymous"),
        orderBy("timestamp", "desc"),
        limit(1)
      );

      const querySnapshot = await getDocs(testQuery);
      console.log("Read successful, documents found:", querySnapshot.size);

      // Clean up test document
      await deleteDoc(docRef);
      console.log("Test document cleaned up");

      setSuccessMessage("Firebase connection is working correctly!");
      setTimeout(() => setSuccessMessage(null), 5000);

      return true;
    } catch (err) {
      console.error("Firebase connection test failed:", err);
      setError(
        `Firebase connection test failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      return false;
    }
  };

  // Add this effect
  useEffect(() => {
    // Check if Firebase is initialized
    if (db) {
      setFirebaseReady(true);
    } else {
      console.error("Firebase db is not initialized");
      setError(
        "Firebase database is not initialized. Please refresh the page."
      );
    }
  }, []);

  // Add these functions after the existing useEffect hooks

  // Load pill reminders from Firestore
  useEffect(() => {
    if (!currentUser) return;

    const pillsRef = collection(db, "pillReminders");
    let pillsQuery;

    try {
      // Try to use the query with ordering
      pillsQuery = query(
        pillsRef,
        where("userId", "==", currentUser.uid),
        orderBy("createdAt", "desc")
      );
    } catch (error) {
      // Fallback to basic query if index is not ready
      console.warn(
        "Falling back to basic query while index is being created:",
        error
      );
      pillsQuery = query(pillsRef, where("userId", "==", currentUser.uid));
    }

    const unsubscribePills = registerListener(
      onSnapshot(
        pillsQuery,
        (snapshot) => {
          const pillData: PillReminder[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            pillData.push({
              id: doc.id,
              name: data.name,
              frequency: data.frequency,
              time: data.time,
              daysOfWeek: data.daysOfWeek || [],
              specificDate: data.specificDate,
              userId: data.userId,
              createdAt: data.createdAt,
              notificationEmail: data.notificationEmail,
              sendNotifications: data.sendNotifications,
              telegramChatId: data.telegramChatId,
              useTelegramNotifications: data.useTelegramNotifications,
            });
          });
          // Sort manually if we're using the fallback query
          if (!pillsQuery.toString().includes("orderBy")) {
            pillData.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          }
          setPills(pillData);
        },
        (error) => {
          console.error("Error fetching pill reminders:", error);
          // If we get an index error, retry with the basic query
          if (
            error.code === "failed-precondition" ||
            error.code === "resource-exhausted"
          ) {
            console.warn("Retrying with basic query due to index error");
            const basicQuery = query(
              pillsRef,
              where("userId", "==", currentUser.uid)
            );
            return onSnapshot(basicQuery, (snapshot) => {
              const pillData: PillReminder[] = [];
              snapshot.forEach((doc) => {
                const data = doc.data();
                pillData.push({
                  id: doc.id,
                  name: data.name,
                  frequency: data.frequency,
                  time: data.time,
                  daysOfWeek: data.daysOfWeek || [],
                  specificDate: data.specificDate,
                  userId: data.userId,
                  createdAt: data.createdAt,
                  notificationEmail: data.notificationEmail,
                  sendNotifications: data.sendNotifications,
                  telegramChatId: data.telegramChatId,
                  useTelegramNotifications: data.useTelegramNotifications,
                });
              });
              // Sort manually since we're not using orderBy
              pillData.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
              setPills(pillData);
            });
          }
          return undefined; // Add a return value for all code paths
        }
      )
    );

    return () => {
      unsubscribePills();
    };
  }, [currentUser]);

  // Handle pill form submission
  const handlePillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setError("You must be logged in to save pill reminders");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const pillsRef = collection(db, "pillReminders");

      // Create the pill reminder object
      const newPillReminder = {
        ...pillFormData,
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
      };

      console.log("Saving pill reminder with data:", newPillReminder);

      // Add to Firestore
      const docRef = await addDoc(pillsRef, newPillReminder);
      console.log("Pill reminder saved with ID:", docRef.id);

      // Reset form
      setPillFormData({
        name: "",
        frequency: "daily",
        time: "09:00",
        daysOfWeek: [],
        specificDate: null,
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
        notificationEmail: currentUser?.email || "",
        sendNotifications: true,
        useTelegramNotifications: false,
      });

      setShowPillForm(false);
      setSuccessMessage("Pill reminder saved successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error("Error saving pill reminder:", err);
      setError(
        `Failed to save pill reminder: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle pill deletion
  const handlePillDelete = async (pillId: string) => {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, "pillReminders", pillId));
      setSuccessMessage("Pill reminder deleted successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error deleting pill reminder:", error);
      setError("Failed to delete pill reminder");
    }
  };

  // Handle pill edit
  const handlePillEdit = (pill: PillReminder) => {
    setPillFormData({
      name: pill.name,
      frequency: pill.frequency,
      time: pill.time,
      daysOfWeek: pill.daysOfWeek || [],
      specificDate: pill.specificDate,
      userId: pill.userId,
      createdAt: pill.createdAt,
      notificationEmail: pill.notificationEmail,
      sendNotifications: pill.sendNotifications,
      telegramChatId: pill.telegramChatId,
      useTelegramNotifications: pill.useTelegramNotifications,
    });
    setShowPillForm(true);
  };

  // Add debug function to show connection info directly
  const debugTelegramConnection = async () => {
    try {
      toast.success("Checking database for Telegram connections...");

      // Try to get all users
      const usersSnapshot = await getDocs(collection(db, "users"));
      console.log(
        "All users:",
        usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );

      // Check if any user has a Telegram chat ID
      let foundConnection = false;

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        if (userData.telegramChatId) {
          // Found a user with telegram chat ID - update UI directly
          console.log(
            `Found user ${userDoc.id} with Telegram chat ID: ${userData.telegramChatId}`
          );
          toast.success(
            `Found Telegram connection for user ${userDoc.id}. Updating UI.`
          );

          // Update the form data directly
          setPillFormData((prevData) => ({
            ...prevData,
            telegramChatId: userData.telegramChatId,
          }));

          // Reset connecting status
          setTelegramConnecting(false);

          foundConnection = true;
          break;
        }
      }

      if (!foundConnection) {
        toast.error(
          "No Telegram connections found in database. Please try connecting again."
        );
      }
    } catch (error) {
      console.error("Error debugging Telegram connection:", error);
      toast.error("Error checking database for Telegram connections");
    }
  };

  // First fix handleTelegramAuth to not use unused parameters
  const handleTelegramAuth = async () => {
    try {
      setTelegramConnecting(true);
      console.log("Starting Telegram authentication process...");
      console.log("Current user:", currentUser);
      console.log("Current pillFormData:", pillFormData);

      // Log initial state to help debug
      if (!currentUser) {
        console.warn(
          "No current user found. Authentication might not work properly."
        );
        toast.error("You must be logged in to connect to Telegram.");
        setTelegramConnecting(false);
        return;
      }

      // Create a deep link to the Telegram bot with the start command pre-filled
      // This will automatically populate the message field with "/start {userId}"
      // IMPORTANT: We must send the Firebase user ID, not the telegram user ID
      const telegramUrl = `https://t.me/mfuturetestbot?start=${currentUser.uid}`;
      console.log(`Generated Telegram URL with start command: ${telegramUrl}`);

      // Open the Telegram URL in a new tab
      window.open(telegramUrl, "_blank");

      // Show a toast message to explain what's happening
      toast.success("Connecting to Telegram...", { duration: 3000 });

      // Wait for a few seconds and then check if the user connected
      setTimeout(() => {
        // Look for telegramChatId in the user's document
        checkForTelegramConnection();
      }, 5000);

      // Add logging for debugging
      console.log("TelegramAuth process initiated");
    } catch (error) {
      console.error("Error in Telegram auth:", error);
      toast.error("Failed to connect to Telegram");
      setTelegramConnecting(false);
    }
  };

  // Fix the toast.info to use toast.loading instead for compatibility
  const checkForTelegramConnection = async () => {
    try {
      if (!currentUser) {
        setTelegramConnecting(false);
        return;
      }

      // Get the user's document to see if telegramChatId was set
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists() && userDoc.data().telegramChatId) {
        // Connection successful!
        toast.success("Successfully connected to Telegram!");

        // Update pill form data
        setPillFormData((prev) => ({
          ...prev,
          telegramChatId: userDoc.data().telegramChatId,
        }));

        setTelegramConnecting(false);
      } else {
        // Not connected yet, check again in a few seconds
        toast.loading("Waiting for Telegram connection...");
        setTimeout(checkForTelegramConnection, 3000);
      }
    } catch (error) {
      console.error("Error checking Telegram connection:", error);
      toast.error("Error checking Telegram connection");
      setTelegramConnecting(false);
    }
  };

  // Add a function to fetch the user's Telegram bots
  const fetchTelegramBots = async () => {
    if (!currentUser) return undefined;

    try {
      // Get the user's Telegram bots from Firestore
      const botsRef = collection(db, "telegramBots");
      const q = query(
        botsRef,
        where("userId", "==", currentUser.uid),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = registerListener(
        onSnapshot(q, (snapshot) => {
          const botsList: TelegramBot[] = [];
          snapshot.forEach((doc) => {
            botsList.push({ id: doc.id, ...doc.data() } as TelegramBot);
          });
          setTelegramBots(botsList);
        })
      );

      return unsubscribe;
    } catch (error) {
      console.error("Error fetching Telegram bots:", error);
      toast.error("Failed to load Telegram bots");
      return undefined; // Add a return value for all code paths
    }
  };

  // Add useEffect to fetch Telegram bots when the component mounts
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (currentUser) {
      const fetchBots = async () => {
        unsubscribe = await fetchTelegramBots();
      };

      fetchBots();
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  // Create a TelegramBotHistory component
  const TelegramBotHistory = () => {
    if (telegramBots.length === 0) {
      return (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl mt-4">
          <p className="text-center text-gray-500 dark:text-gray-400">
            No Telegram bots connected yet.
          </p>
        </div>
      );
    }

    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl mt-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
          Your Telegram Bots
        </h3>
        <div className="space-y-3">
          {telegramBots.map((bot) => (
            <div
              key={bot.id}
              className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-blue-600 dark:text-blue-400"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    @{bot.botName}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {bot.chatId ? (
                      <span className="text-green-600 dark:text-green-400">
                        Connected
                        {bot.username && ` as @${bot.username}`}
                      </span>
                    ) : (
                      "Not connected"
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Added on {new Date(bot.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <a
                      href={`https://t.me/${bot.botName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Open in Telegram
                    </a>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSetActiveBot(bot.id)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    bot.isActive
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {bot.isActive ? "Active" : "Set Active"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteBot(bot.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
            How to use your bot
          </h4>
          <ol className="list-decimal list-inside text-xs text-blue-700 dark:text-blue-400 space-y-1">
            <li>Create a bot with @BotFather on Telegram</li>
            <li>Add the bot name and token in the notification settings</li>
            <li>Click Connect and authorize in Telegram</li>
            <li>Your pill reminders will be sent to this bot</li>
          </ol>
        </div>
      </div>
    );
  };

  // Function to set a bot as active
  const handleSetActiveBot = async (botId: string) => {
    if (!currentUser) return;

    try {
      // Get the bot data
      const botDoc = await getDoc(doc(db, "telegramBots", botId));
      if (!botDoc.exists()) {
        toast.error("Bot not found");
        return;
      }

      const botData = botDoc.data() as TelegramBot;

      // Update all bots to be inactive
      const botsRef = collection(db, "telegramBots");
      const q = query(botsRef, where("userId", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);

      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.update(doc.ref, { isActive: false });
      });

      // Set the selected bot as active
      batch.update(doc(db, "telegramBots", botId), { isActive: true });

      // Update the user document with the current bot token
      batch.update(doc(db, "users", currentUser.uid), {
        currentBotId: botId,
        telegramBotToken: botData.botToken,
        telegramChatId: botData.chatId || null,
      });

      await batch.commit();

      // Update local state if this bot has a chat ID
      if (botData.chatId) {
        setPillFormData({
          ...pillFormData,
          telegramChatId: botData.chatId,
        });
      }

      toast.success("Bot set as active");
    } catch (error) {
      console.error("Error setting bot as active:", error);
      toast.error("Failed to set bot as active");
    }
  };

  // Function to delete a bot
  const handleDeleteBot = async (botId: string) => {
    if (!currentUser) return;

    try {
      // Check if this is the active bot
      const botDoc = await getDoc(doc(db, "telegramBots", botId));
      if (!botDoc.exists()) {
        toast.error("Bot not found");
        return;
      }

      const botData = botDoc.data() as TelegramBot;

      // Delete the bot
      await deleteDoc(doc(db, "telegramBots", botId));

      // If this was the active bot, update the user document
      if (botData.isActive) {
        // Find another bot to set as active
        const botsRef = collection(db, "telegramBots");
        const q = query(
          botsRef,
          where("userId", "==", currentUser.uid),
          limit(1)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const newActiveBot = querySnapshot.docs[0];
          const newActiveBotData = newActiveBot.data() as TelegramBot;

          // Set the new bot as active
          await updateDoc(newActiveBot.ref, { isActive: true });

          // Update the user document
          await updateDoc(doc(db, "users", currentUser.uid), {
            currentBotId: newActiveBot.id,
            telegramBotToken: newActiveBotData.botToken,
            telegramChatId: newActiveBotData.chatId || null,
          });

          // Update local state if this bot has a chat ID
          if (newActiveBotData.chatId) {
            setPillFormData({
              ...pillFormData,
              telegramChatId: newActiveBotData.chatId,
            });
          }
        } else {
          // No bots left, clear the user's bot data
          await updateDoc(doc(db, "users", currentUser.uid), {
            currentBotId: null,
            telegramBotToken: null,
            telegramChatId: null,
          });

          // Update local state
          setPillFormData({
            ...pillFormData,
            telegramChatId: undefined,
          });
        }
      }

      toast.success("Bot deleted");
    } catch (error) {
      console.error("Error deleting bot:", error);
      toast.error("Failed to delete bot");
    }
  };

  // Add a function to toggle the bot history visibility
  const toggleBotHistory = () => {
    setShowBotHistory(!showBotHistory);
  };

  // Add a function to fetch pill history
  const fetchPillHistory = useCallback(async () => {
    if (!currentUser) return;

    setIsPillHistoryLoading(true);

    try {
      const historyRef = collection(db, "pillHistory");
      const historyQuery = query(
        historyRef,
        where("userId", "==", currentUser.uid),
        orderBy("timestamp", "desc")
      );

      const snapshot = await getDocs(historyQuery);
      const historyData: PillHistoryEntry[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        historyData.push({
          id: doc.id,
          pillId: data.pillId,
          userId: data.userId,
          action: data.action,
          timestamp: data.timestamp,
          telegramUserId: data.telegramUserId,
        });
      });

      setPillHistory(historyData);
    } catch (error) {
      console.error("Error fetching pill history:", error);
    } finally {
      setIsPillHistoryLoading(false);
    }
  }, [currentUser]);

  // Fetch pill history when the component mounts or user changes
  useEffect(() => {
    fetchPillHistory();
  }, [currentUser, fetchPillHistory]);

  // Add a function to mark a pill as taken directly from the UI
  const markPillAsTaken = async (pillId: string) => {
    if (!currentUser) return;

    try {
      // Create a history entry
      const historyRef = collection(db, "pillHistory");
      await addDoc(historyRef, {
        pillId: pillId,
        userId: currentUser.uid,
        action: "taken",
        timestamp: Timestamp.now(),
      });

      // Show success message
      toast.success("Pill marked as taken!");

      // Refresh the pill history
      fetchPillHistory();
    } catch (error) {
      console.error("Error marking pill as taken:", error);
      toast.error("Failed to mark pill as taken");
    }
  };

  // If still loading or not logged in show loading state
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

            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(-10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            .animate-fadeIn {
              animation: fadeIn 0.2s ease-out forwards;
            }

            /* Long press animation */
            @keyframes pulse {
              0% {
                transform: scale(1);
              }
              50% {
                transform: scale(1.05);
              }
              100% {
                transform: scale(1);
              }
            }

            .calendar-day[data-long-pressing="true"] {
              animation: pulse 1s infinite;
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
    <div className="w-full max-w-full md:max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col min-h-screen relative">
        {/* Dotted pattern background - visible on all devices */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="dotted-pattern absolute inset-0" />
        </div>

        {/* Firebase initialization indicator */}
        {!firebaseReady && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 dark:bg-yellow-900/70 border border-yellow-500 text-yellow-700 dark:text-yellow-300 px-4 py-2 rounded-lg shadow-lg z-50">
            <div className="flex items-center">
              <div className="inline-block h-4 w-4 border-2 border-yellow-600 dark:border-yellow-400 border-t-transparent rounded-full animate-spin mr-2"></div>
              <p>Initializing Firebase connection...</p>
            </div>
          </div>
        )}

        <main className="flex-grow flex flex-col items-center py-6 sm:p-8 relative z-10">
          <style jsx>{`
            .dotted-pattern {
              background-image: radial-gradient(#212529 1px, transparent 1px);
              background-size: 24px 24px;
              opacity: 0.1;
            }

            :global(.dark) .dotted-pattern {
              background-image: radial-gradient(#e2e8f0 1px, transparent 1px);
              opacity: 0.05;
            }

            .calendar-day {
              aspect-ratio: 1 / 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              cursor: pointer;
              transition: all 0.2s;
              min-height: 2.5rem; /* Minimum height for better touch targets */
              touch-action: manipulation; /* Improve touch behavior */
            }

            @media (max-width: 640px) {
              .calendar-day {
                padding: 0.5rem; /* More padding on mobile */
              }
            }

            .calendar-day:hover {
              background-color: rgba(59, 130, 246, 0.1);
            }

            :global(.dark) .calendar-day:hover {
              background-color: rgba(59, 130, 246, 0.3);
            }

            .calendar-day.selected {
              background-color: rgba(59, 130, 246, 0.2);
              font-weight: bold;
            }

            :global(.dark) .calendar-day.selected {
              background-color: rgba(59, 130, 246, 0.4);
            }

            .calendar-day.has-weight {
              border-bottom: 2px solid #3b82f6;
            }

            :global(.dark) .calendar-day.has-weight {
              border-bottom: 2px solid #60a5fa;
            }

            .weight-value {
              font-size: 0.5rem;
              color: #2563eb;
              font-weight: 500;
              line-height: 1;
              margin-top: 2px;
            }

            :global(.dark) .weight-value {
              color: #60a5fa;
            }

            @media (min-width: 640px) {
              .weight-value {
                font-size: 1rem;
              }
            }

            /* Improve placeholder color for better readability */
            ::placeholder {
              color: #495057;
              opacity: 1;
            }

            :global(.dark) ::placeholder {
              color: #94a3b8;
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

            /* Long press animation */
            @keyframes pulse {
              0% {
                transform: scale(1);
              }
              50% {
                transform: scale(1.05);
              }
              100% {
                transform: scale(1);
              }
            }

            .calendar-day[data-long-pressing="true"] {
              animation: pulse 1s infinite;
            }
          `}</style>

          {/* Header */}
          <div className="bg-white/80 dark:bg-dark-primary backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg w-full max-w-full md:max-w-5xl lg:max-w-6xl xl:max-w-7xl mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">
                Fitness Tracker
              </h1>
              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">
                  {currentUser.email}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1"
                  aria-label="Sign out"
                >
                  <FaSignOutAlt />{" "}
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
                <Link
                  href="/"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm md:text-base"
                >
                  Home
                </Link>
              </div>
            </div>
            <p className="text-sm md:text-base text-gray-900 dark:text-gray-300 mb-4 sm:mb-6 text-center">
              Track your workouts and monitor your fitness progress over time.
            </p>
          </div>

          {/* Tabs */}
          <div className="w-full max-w-full md:max-w-5xl lg:max-w-6xl xl:max-w-7xl mb-6">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                className={`py-2 px-4 font-medium text-sm sm:text-base ${
                  activeTab === "workouts"
                    ? "border-b-2 border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-blue-900/20"
                }`}
                onClick={() => setActiveTab("workouts")}
              >
                Workouts
              </button>
              <button
                className={`py-2 px-4 font-medium text-sm sm:text-base ${
                  activeTab === "weight"
                    ? "border-b-2 border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-blue-900/20"
                }`}
                onClick={() => setActiveTab("weight")}
              >
                Weight Tracker
              </button>
              <button
                className={`py-2 px-4 font-medium text-sm sm:text-base ${
                  activeTab === "pills"
                    ? "border-b-2 border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-blue-900/20"
                }`}
                onClick={() => setActiveTab("pills")}
              >
                Pills Reminder
              </button>
            </div>
          </div>

          {/* Content based on active tab */}
          <div className="w-full max-w-full md:max-w-5xl lg:max-w-6xl xl:max-w-7xl">
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
                            new Date(b.date).getTime() -
                            new Date(a.date).getTime()
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
                                    {new Date(
                                      workout.date
                                    ).toLocaleDateString()}{" "}
                                    • {workout.duration} minutes
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
                {activeTab === "weight" ? (
                  <>
                    {/* Weight Tracker */}
                    <div className="bg-white dark:bg-dark-primary rounded-xl shadow-md p-6 mb-6">
                      <div className="flex justify-between items-center mb-5">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          Weight Calendar
                        </h2>

                        {weightTrend && (
                          <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-lighter px-3 py-1 rounded-full">
                            You have {weightTrend.direction}{" "}
                            {Math.abs(parseFloat(weightTrend.totalChange))}kg
                            over {weightTrend.period}
                          </div>
                        )}
                      </div>

                      {/* Calendar Navigation */}
                      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
                        <div className="flex items-center">
                          <button
                            onClick={prevMonth}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                            aria-label="Previous month"
                          >
                            <FaChevronLeft />
                          </button>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mx-2">
                            {formatMonthYear(currentMonth)}
                          </h3>
                          <button
                            onClick={nextMonth}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                            aria-label="Next month"
                          >
                            <FaChevronRight />
                          </button>
                        </div>

                        {/* Today button */}
                        <button
                          onClick={goToToday}
                          className="flex items-center gap-1 text-sm bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800/60 transition-colors"
                        >
                          <FaCalendarDay /> Today
                        </button>
                      </div>

                      {/* Calendar hint */}
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 text-center">
                        <span className="hidden md:inline">
                          Click to select or hold for 2 seconds for quick entry
                        </span>
                        <span className="md:hidden">
                          Tap on a day to select it
                        </span>
                      </div>

                      {/* Calendar */}
                      <div className="mb-6 px-1 sm:px-2">
                        {/* Day names */}
                        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2 mb-2">
                          {[
                            "Sun",
                            "Mon",
                            "Tue",
                            "Wed",
                            "Thu",
                            "Fri",
                            "Sat",
                          ].map((day) => (
                            <div
                              key={day}
                              className="text-center text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 py-1"
                            >
                              {/* Show abbreviated day names on small screens */}
                              <span className="hidden sm:inline">{day}</span>
                              <span className="sm:hidden">
                                {day.substring(0, 1)}
                              </span>
                            </div>
                          ))}
                        </div>
                        {/* test */}

                        {/* Calendar days */}
                        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2">
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
                            const isToday =
                              dateString ===
                              new Date().toISOString().split("T")[0];
                            const isLongPressing = longPressActive === day;

                            return (
                              <div
                                key={`day-${day}`}
                                className={`calendar-day border border-gray-300 dark:border-gray-700 rounded-md cursor-pointer transition-all duration-200 relative overflow-hidden p-0.5 sm:p-1.5
                                  ${
                                    isSelected
                                      ? "selected bg-blue-100 dark:bg-blue-900/40 border-blue-400 dark:border-blue-600"
                                      : ""
                                  }
                                  ${weight ? "has-weight" : ""}
                                  ${
                                    isToday
                                      ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-dark-primary"
                                      : ""
                                  }
                                  ${isLongPressing ? "animate-pulse" : ""}
                                  hover:bg-blue-50 dark:hover:bg-blue-900/20
                                `}
                                onClick={() => handleDateClick(day)}
                                onMouseDown={() => handleDayMouseDown(day)}
                                onMouseUp={handleDayMouseUp}
                                onMouseLeave={handleDayMouseLeave}
                                onTouchStart={() => handleDateClick(day)} // For mobile, just use click
                              >
                                <div
                                  className={`text-gray-900 dark:text-white text-sm sm:text-base ${
                                    isToday ? "font-bold" : ""
                                  }`}
                                >
                                  {day}
                                </div>

                                {weight && (
                                  <div className="weight-value text-blue-700 dark:text-blue-300 font-medium text-[0.6rem] sm:text-[0.7rem]">
                                    {weight}kg
                                  </div>
                                )}

                                {/* Long press progress bar */}
                                {isLongPressing && (
                                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700">
                                    <div
                                      className="h-full bg-blue-600 transition-all duration-50 ease-linear"
                                      style={{ width: `${longPressProgress}%` }}
                                    ></div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Weight Entry Form - make it wider and more mobile-friendly */}
                      <div className="bg-white dark:bg-dark-primary rounded-xl shadow-md p-4 sm:p-6 md:p-8 mb-6 w-full">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
                          Record Weight for{" "}
                          <span className="text-blue-600 dark:text-blue-400">
                            {new Date(selectedDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </span>
                        </h3>

                        <form
                          onSubmit={handleWeightSubmit}
                          className="space-y-4"
                        >
                          <div>
                            <label
                              htmlFor="weight"
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                            >
                              Weight (kg)
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                id="weight"
                                name="weight"
                                min="20"
                                max="500"
                                step="0.1"
                                value={weightInput}
                                onChange={(e) => setWeightInput(e.target.value)}
                                className="w-full p-3 sm:p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-dark-lighter text-gray-900 dark:text-gray-100"
                                placeholder="Enter your weight in kg"
                                required
                              />
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <span className="text-gray-500 dark:text-gray-400">
                                  kg
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2 justify-end">
                            <button
                              type="submit"
                              className={`px-4 py-3 sm:py-4 rounded-lg transition-colors flex items-center justify-center ${
                                isSaving || !firebaseReady
                                  ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                                  : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white shadow-sm hover:shadow"
                              }`}
                              disabled={isSaving || !firebaseReady}
                            >
                              {isSaving ? (
                                <>
                                  <div className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                  Saving...
                                </>
                              ) : !firebaseReady ? (
                                "Firebase Initializing..."
                              ) : (
                                "Save"
                              )}
                            </button>

                            {/* Improved Cancel button */}
                            {isSaving && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsSaving(false);
                                  setError(
                                    "Save operation was cancelled. Please try again."
                                  );
                                }}
                                className="px-4 py-3 sm:py-4 rounded-lg bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white shadow-sm transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </form>
                      </div>

                      {/* Weight History - make it wider */}
                      <div className="bg-white dark:bg-dark-primary rounded-xl shadow-md p-6 sm:p-8 w-full">
                        <div className="flex justify-between items-center mb-5">
                          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                            Weight History
                          </h2>
                          <button
                            onClick={manualRefresh}
                            disabled={isFetching}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/60 transition-colors"
                          >
                            {isFetching ? (
                              <>
                                <div className="inline-block h-4 w-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                Refreshing...
                              </>
                            ) : (
                              <>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                  />
                                </svg>
                                Refresh Data
                              </>
                            )}
                          </button>
                        </div>

                        {/* Weight History Component */}
                        <WeightHistory
                          weightHistory={weightEntries}
                          isLoading={isInitialLoading || isFetching}
                          error={error}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Pills Reminder */}
                    <div className="bg-white dark:bg-dark-primary rounded-xl shadow-md p-6 mb-6">
                      <div className="flex justify-between items-center mb-5">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          Pills Reminder
                        </h2>

                        {/* Add Pills Button */}
                        <div className="w-full max-w-4xl mb-6">
                          <button
                            onClick={() => setShowPillForm(!showPillForm)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                          >
                            <FaPlus /> {showPillForm ? "Cancel" : "Add Pill"}
                          </button>
                        </div>
                      </div>

                      {/* Pills List */}
                      <div className="bg-white dark:bg-dark-primary rounded-xl shadow-md p-6 mb-6">
                        {pills.length === 0 ? (
                          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-gray-700">
                              No pills reminders added yet. Start by adding your
                              first reminder!
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {pills.map((pill) => (
                              <div
                                key={pill.id}
                                className="border border-gray-300 rounded-lg p-4 bg-white/95 hover:shadow-md transition-shadow"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-100 rounded-full">
                                      <FaHeartbeat className="text-green-600" />
                                    </div>
                                    <div>
                                      <h3 className="font-medium text-gray-900">
                                        {pill.name}
                                      </h3>
                                      <div className="text-sm text-gray-700 space-y-1">
                                        <p>
                                          {pill.frequency === "daily"
                                            ? "Daily"
                                            : pill.frequency === "weekly"
                                            ? "Weekly"
                                            : "Specific Date"}
                                          {" at "}
                                          {pill.time}
                                        </p>
                                        {pill.frequency === "weekly" &&
                                          pill.daysOfWeek && (
                                            <p className="text-gray-600">
                                              Days:{" "}
                                              {pill.daysOfWeek
                                                .map((day) => day.slice(0, 3))
                                                .join(", ")}
                                            </p>
                                          )}
                                        {pill.frequency === "specific_date" &&
                                          pill.specificDate && (
                                            <p className="text-gray-600">
                                              Date:{" "}
                                              {new Date(
                                                pill.specificDate
                                              ).toLocaleDateString()}
                                            </p>
                                          )}

                                        {/* Notification Methods */}
                                        {pill.sendNotifications && (
                                          <div className="flex flex-wrap gap-2 mt-1">
                                            {pill.notificationEmail && (
                                              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <svg
                                                  xmlns="http://www.w3.org/2000/svg"
                                                  className="h-3 w-3"
                                                  viewBox="0 0 20 20"
                                                  fill="currentColor"
                                                >
                                                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                                </svg>
                                                Email
                                              </span>
                                            )}

                                            {pill.useTelegramNotifications &&
                                              pill.telegramChatId && (
                                                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                  <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-3 w-3"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                  >
                                                    viewBox="0 0 24 24"
                                                    fill="currentColor"
                                                  >
                                                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                                                  </svg>
                                                  Telegram
                                                </span>
                                              )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => markPillAsTaken(pill.id)}
                                      className="text-green-700 hover:text-green-900 p-1"
                                      aria-label="Mark pill as taken"
                                      title="Mark as taken"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handlePillEdit(pill)}
                                      className="text-blue-700 hover:text-blue-900 p-1"
                                      aria-label="Edit pill"
                                    >
                                      <FaEdit />
                                    </button>
                                    <button
                                      onClick={() => handlePillDelete(pill.id)}
                                      className="text-red-700 hover:text-red-900 p-1"
                                      aria-label="Delete pill"
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Pill History Section */}
                      <div className="mt-8">
                        <PillHistoryComponent
                          pillHistory={pillHistory}
                          pills={pills}
                          isLoading={isPillHistoryLoading}
                        />
                      </div>

                      {/* Add/Edit Pill Form */}
                      {showPillForm && (
                        <div className="bg-white/90 dark:bg-dark-primary/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg w-full max-w-4xl mb-6">
                          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
                            Add New Pill
                          </h2>
                          <form
                            onSubmit={handlePillSubmit}
                            className="space-y-6"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <label
                                  htmlFor="name"
                                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                  Pill Name
                                </label>
                                <input
                                  type="text"
                                  id="name"
                                  name="name"
                                  value={pillFormData.name}
                                  onChange={(e) =>
                                    setPillFormData({
                                      ...pillFormData,
                                      name: e.target.value,
                                    })
                                  }
                                  placeholder="e.g., Vitamin D"
                                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-dark-lighter text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <label
                                  htmlFor="frequency"
                                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                  Frequency
                                </label>
                                <select
                                  id="frequency"
                                  name="frequency"
                                  value={pillFormData.frequency}
                                  onChange={(e) =>
                                    setPillFormData({
                                      ...pillFormData,
                                      frequency: e.target.value as
                                        | "daily"
                                        | "weekly"
                                        | "specific_date",
                                      // Reset daysOfWeek when switching to daily
                                      daysOfWeek:
                                        e.target.value === "daily"
                                          ? []
                                          : pillFormData.daysOfWeek,
                                    })
                                  }
                                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-dark-lighter text-gray-900 dark:text-white"
                                  required
                                >
                                  <option value="daily">Daily</option>
                                  <option value="weekly">Weekly</option>
                                  <option value="specific_date">
                                    Specific Date
                                  </option>
                                </select>
                              </div>

                              <div className="space-y-2">
                                <label
                                  htmlFor="time"
                                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                  Time
                                </label>
                                <input
                                  type="time"
                                  id="time"
                                  name="time"
                                  value={pillFormData.time}
                                  onChange={(e) =>
                                    setPillFormData({
                                      ...pillFormData,
                                      time: e.target.value,
                                    })
                                  }
                                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-dark-lighter text-gray-900 dark:text-white"
                                  required
                                />
                              </div>

                              {pillFormData.frequency === "specific_date" && (
                                <div className="space-y-2">
                                  <label
                                    htmlFor="specificDate"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                  >
                                    Specific Date
                                  </label>
                                  <input
                                    type="date"
                                    id="specificDate"
                                    name="specificDate"
                                    value={pillFormData.specificDate || ""}
                                    onChange={(e) =>
                                      setPillFormData({
                                        ...pillFormData,
                                        specificDate: e.target.value,
                                      })
                                    }
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-dark-lighter text-gray-900 dark:text-white"
                                  />
                                </div>
                              )}

                              {pillFormData.frequency === "weekly" && (
                                <div className="space-y-2 md:col-span-2">
                                  <label
                                    htmlFor="daysOfWeek"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                                  >
                                    Days of Week
                                  </label>
                                  <div className="flex flex-wrap gap-2">
                                    {[
                                      "Monday",
                                      "Tuesday",
                                      "Wednesday",
                                      "Thursday",
                                      "Friday",
                                      "Saturday",
                                      "Sunday",
                                    ].map((day) => (
                                      <label
                                        key={day}
                                        className={`
                                          flex items-center justify-center px-4 py-2 rounded-lg cursor-pointer
                                          transition-all duration-200 ease-in-out
                                          ${
                                            pillFormData.daysOfWeek?.includes(
                                              day
                                            )
                                              ? "bg-blue-500 text-white hover:bg-blue-600"
                                              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                          }
                                        `}
                                      >
                                        <input
                                          type="checkbox"
                                          value={day}
                                          checked={pillFormData.daysOfWeek?.includes(
                                            day
                                          )}
                                          onChange={(e) => {
                                            const isChecked = e.target.checked;
                                            setPillFormData({
                                              ...pillFormData,
                                              daysOfWeek: isChecked
                                                ? [
                                                    ...(pillFormData.daysOfWeek ||
                                                      []),
                                                    day,
                                                  ]
                                                : pillFormData.daysOfWeek?.filter(
                                                    (d) => d !== day
                                                  ) || [],
                                            });
                                          }}
                                          className="sr-only"
                                        />
                                        <span>{day.slice(0, 3)}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Email Notification Settings */}
                              <NotificationSettings
                                sendNotifications={
                                  pillFormData.sendNotifications
                                }
                                toggleNotifications={() =>
                                  setPillFormData({
                                    ...pillFormData,
                                    sendNotifications:
                                      !pillFormData.sendNotifications,
                                  })
                                }
                                notificationEmail={
                                  pillFormData.notificationEmail
                                }
                                setNotificationEmail={(email) =>
                                  setPillFormData({
                                    ...pillFormData,
                                    notificationEmail: email,
                                  })
                                }
                                telegramChatId={pillFormData.telegramChatId}
                                useTelegramNotifications={
                                  pillFormData.useTelegramNotifications
                                }
                                toggleTelegramNotifications={() =>
                                  setPillFormData({
                                    ...pillFormData,
                                    useTelegramNotifications:
                                      !pillFormData.useTelegramNotifications,
                                  })
                                }
                                handleTelegramAuth={handleTelegramAuth}
                                telegramConnecting={telegramConnecting}
                                showBotHistory={showBotHistory}
                                toggleBotHistory={toggleBotHistory}
                                debugTelegramConnection={
                                  debugTelegramConnection
                                }
                              />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                              <button
                                type="button"
                                onClick={() => setShowPillForm(false)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                              >
                                {isSaving ? (
                                  <div className="flex items-center">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Saving...
                                  </div>
                                ) : (
                                  "Save Pill"
                                )}
                              </button>
                            </div>

                            {error && (
                              <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
                                {error}
                                {error.includes("network") && (
                                  <div className="mt-2">
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleWeightSubmit(
                                          e as unknown as React.FormEvent
                                        );
                                      }}
                                      className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                    >
                                      Try Again
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {successMessage && (
                              <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
                                {successMessage}
                              </div>
                            )}
                          </form>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Debug Information */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md text-xs">
              <h4 className="font-bold mb-1">Debug Info:</h4>
              <p>isSaving: {isSaving ? "true" : "false"}</p>
              <p>isLoading: {isInitialLoading ? "true" : "false"}</p>
              <p>isFetching: {isFetching ? "true" : "false"}</p>
              <p>User ID: {currentUser?.uid || "Not logged in"}</p>
              <p>Weight Entries: {weightEntries.length}</p>
              <p>
                Network Status: {checkNetworkStatus() ? "Online" : "Offline"}
              </p>
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
                <button
                  onClick={debugFirebaseConnection}
                  className="px-2 py-1 bg-purple-500 text-white rounded text-xs"
                >
                  Test Firebase
                </button>
              </div>
            </div>
          )}

          {/* Show Telegram Bot History if enabled */}
          {showBotHistory && <TelegramBotHistory />}
        </main>

        {/* Footer */}
        <footer className="w-full py-3 sm:py-4 bg-gray-100/80 dark:bg-dark-primary backdrop-blur-sm border-t border-gray-200 dark:border-gray-800 mt-auto relative z-10">
          <div className="container mx-auto px-4 max-w-full md:max-w-5xl lg:max-w-6xl xl:max-w-7xl">
            <div className="flex flex-col items-center justify-center">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center">
                © {new Date().getFullYear()} FitAmIn. All rights reserved.
              </p>
            </div>
          </div>
        </footer>

        {/* Network Status Indicator - now using isOnline state */}
        <div
          className={`fixed bottom-4 right-4 px-3 py-2 rounded-lg shadow-lg text-sm ${
            isOnline
              ? "bg-green-100 dark:bg-green-900/70 border-l-4 border-green-500 text-green-700 dark:text-green-300"
              : "bg-yellow-100 dark:bg-yellow-900/70 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-300"
          }`}
        >
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              {isOnline ? (
                <path
                  fillRule="evenodd"
                  d="M5.05 3.636a1 1 0 010 1.414 7 7 0 000 9.9 1 1 0 11-1.414 1.414 9 9 0 010-12.728 1 1 0 011.414 0zm9.9 0a1 1 0 011.414 0 9 9 0 010 12.728 1 1 0 01-1.414-1.414 7 7 0 000-9.9 1 1 0 010-1.414zM7.879 6.464a1 1 0 010 1.414 3 3 0 000 4.243 1 1 0 11-1.415 1.414 5 5 0 010-7.07 1 1 0 011.415 0zm4.242 0a1 1 0 011.415 0 5 5 0 010 7.072 1 1 0 01-1.415-1.414 3 3 0 000-4.244 1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              )}
            </svg>
            <p>
              {isOnline
                ? "You are online. Changes will be saved immediately."
                : "You are offline. Changes will be saved when you reconnect."}
            </p>
          </div>
        </div>

        {/* Modal with blurred background and click-outside dismissal */}
        {showModal && (
          <div
            className="fixed inset-0 backdrop-blur-md bg-black/30 dark:bg-black/50 flex items-center justify-center z-50 p-4 transition-all duration-200"
            onClick={() => setShowModal(false)}
          >
            <div
              className="bg-white dark:bg-dark-primary rounded-xl shadow-xl max-w-md w-full p-8 relative animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-5 right-5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                aria-label="Close modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Record Weight for{" "}
                <span className="text-blue-600 dark:text-blue-400">
                  {new Date(modalDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </h3>

              <form onSubmit={handleModalSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="modalWeight"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    id="modalWeight"
                    value={modalWeight}
                    onChange={(e) => setModalWeight(e.target.value)}
                    placeholder="Enter weight in kg"
                    step="0.1"
                    min="20"
                    max="300"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-dark-lighter text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-3">
                  {!isSaving && (
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-lighter/70 transition-colors font-medium"
                    >
                      Close
                    </button>
                  )}

                  <button
                    type="submit"
                    className={`px-5 py-2.5 rounded-lg transition-colors font-medium ${
                      isSaving
                        ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white shadow-sm hover:shadow"
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

                  {isSaving && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsSaving(false);
                        setError(
                          "Save operation was cancelled. Please try again."
                        );
                      }}
                      className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white shadow-sm transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {error && (
                  <div className="text-red-500 dark:text-red-300 text-sm bg-red-50 dark:bg-red-900/30 p-4 rounded-lg mt-4">
                    {error}
                    {error.includes("network") && (
                      <div className="mt-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleWeightSubmit(e as unknown as React.FormEvent);
                          }}
                          className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                        >
                          Try Again
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {successMessage && (
                  <div className="text-green-500 dark:text-green-300 text-sm bg-green-50 dark:bg-green-900/30 p-4 rounded-lg mt-4 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2 flex-shrink-0"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {successMessage}
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
