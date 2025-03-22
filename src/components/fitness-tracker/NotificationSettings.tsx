import React, { useState, useEffect } from "react";

interface NotificationSettingsProps {
  sendNotifications: boolean;
  toggleNotifications: () => void;
  notificationEmail: string;
  setNotificationEmail: (email: string) => void;
  useBrowserNotifications: boolean;
  toggleBrowserNotifications: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  sendNotifications,
  toggleNotifications,
  notificationEmail,
  setNotificationEmail,
  useBrowserNotifications,
  toggleBrowserNotifications,
}) => {
  const [permissionStatus, setPermissionStatus] = useState<
    NotificationPermission | "unsupported"
  >("default");

  // Check if browser notifications are supported
  useEffect(() => {
    if (!("Notification" in window)) {
      setPermissionStatus("unsupported");
    } else {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission === "granted") {
        // Show a test notification
        const notification = new Notification("Notifications enabled!", {
          body: "You will now receive pill reminders as browser notifications.",
          icon: "/favicon.ico",
        });

        // Close the notification after 5 seconds
        setTimeout(() => notification.close(), 5000);

        // Enable browser notifications
        if (!useBrowserNotifications) {
          toggleBrowserNotifications();
        }
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  return (
    <div className="space-y-4 md:col-span-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-base font-medium text-gray-700 dark:text-gray-200">
            Notification Settings
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Get reminders when it&apos;s time to take your pills
          </p>
        </div>
        <button
          type="button"
          onClick={toggleNotifications}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            sendNotifications
              ? "bg-blue-600 dark:bg-blue-500"
              : "bg-gray-200 dark:bg-gray-700"
          }`}
          aria-pressed={sendNotifications}
          aria-labelledby="notifications-label"
        >
          <span className="sr-only">
            {sendNotifications ? "Enable" : "Disable"} notifications
          </span>
          <span
            className={`${
              sendNotifications ? "translate-x-6" : "translate-x-1"
            } inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out`}
          />
        </button>
      </div>

      {sendNotifications && (
        <div className="space-y-4 mt-4">
          {/* Notification Methods */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notification Methods
            </label>

            {/* Hidden input for email - keeps functionality but is not visible */}
            <input
              type="hidden"
              id="notificationEmail"
              name="notificationEmail"
              value={notificationEmail}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNotificationEmail(e.target.value)
              }
            />

            {/* Browser Notification Toggle */}
            <div className="flex flex-col p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-blue-600 dark:text-blue-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Browser Notifications
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {permissionStatus === "granted"
                        ? "Notifications are enabled in this browser"
                        : permissionStatus === "denied"
                        ? "Notifications are blocked - please enable them in your browser settings"
                        : permissionStatus === "unsupported"
                        ? "Your browser doesn't support notifications"
                        : "Allow notifications to receive pill reminders"}
                    </p>
                  </div>
                </div>

                {permissionStatus === "granted" ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-600 dark:text-green-400">
                      Enabled
                    </span>
                    <button
                      type="button"
                      onClick={toggleBrowserNotifications}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        useBrowserNotifications
                          ? "bg-blue-600 dark:bg-blue-500"
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    >
                      <span className="sr-only">
                        Toggle browser notifications
                      </span>
                      <span
                        className={`${
                          useBrowserNotifications
                            ? "translate-x-6"
                            : "translate-x-1"
                        } inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out`}
                      />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {permissionStatus !== "unsupported" &&
                      permissionStatus !== "denied" && (
                        <button
                          type="button"
                          onClick={requestNotificationPermission}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                        >
                          Enable
                        </button>
                      )}
                    {permissionStatus === "denied" && (
                      <span className="text-xs text-red-600 dark:text-red-400">
                        Blocked
                      </span>
                    )}
                  </div>
                )}
              </div>

              {permissionStatus === "granted" && useBrowserNotifications && (
                <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-xs text-green-700 dark:text-green-300">
                    ✓ You will receive browser notifications when it's time to
                    take your pills
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Note: Notifications will work even when the browser is
                    minimized on desktop. On mobile, notifications will only
                    show when the browser is open.
                  </p>
                </div>
              )}

              {permissionStatus === "denied" && (
                <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-xs text-red-700 dark:text-red-300">
                    You have blocked notifications for this site. To enable
                    them:
                  </p>
                  <ol className="text-xs text-red-600 dark:text-red-400 list-decimal list-inside mt-1 space-y-1">
                    <li>
                      Click the lock/info icon in your browser's address bar
                    </li>
                    <li>Find "Notifications" settings</li>
                    <li>Change from "Block" to "Allow"</li>
                    <li>Refresh this page</li>
                  </ol>
                </div>
              )}

              {permissionStatus === "unsupported" && (
                <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    Your browser doesn't support notifications. Try using
                    Chrome, Firefox, Safari, or Edge for the best experience.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;
