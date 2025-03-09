"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import FitnessTrackerContent from "@/components/fitness-tracker/FitnessTrackerContent";

export default function FitnessTrackerPage() {
  return (
    <ProtectedRoute>
      <FitnessTrackerContent />
    </ProtectedRoute>
  );
}
