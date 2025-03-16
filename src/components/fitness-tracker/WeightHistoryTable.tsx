import React from "react";

interface WeightEntry {
  id: string;
  weight: number;
  date: string;
}

interface WeightHistoryTableProps {
  weightHistory: WeightEntry[];
  isLoading: boolean;
  error: string | null;
}

export default function WeightHistoryTable({
  weightHistory,
  isLoading,
  error,
}: WeightHistoryTableProps) {
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
