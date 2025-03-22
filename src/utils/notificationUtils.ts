/**
 * Utility functions for handling browser notifications
 */

/**
 * Request permission for browser notifications
 * @returns A promise that resolves to the notification permission status
 */
export const requestNotificationPermission =
  async (): Promise<NotificationPermission> => {
    if (!("Notification" in window)) {
      throw new Error("This browser does not support desktop notifications");
    }

    // Check if permission is already granted
    if (Notification.permission === "granted") {
      return "granted";
    }

    // Request permission from the user
    const permission = await Notification.requestPermission();
    return permission;
  };

/**
 * Check if the browser supports notifications
 * @returns True if the browser supports notifications, false otherwise
 */
export const browserSupportsNotifications = (): boolean => {
  return "Notification" in window;
};

/**
 * Get the current notification permission status
 * @returns The current notification permission status or "unsupported" if not available
 */
export const getNotificationPermission = ():
  | NotificationPermission
  | "unsupported" => {
  if (!("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
};

/**
 * Show a browser notification
 * @param title The notification title
 * @param options Notification options
 * @returns The notification object
 */
export const showNotification = (
  title: string,
  options?: NotificationOptions
): Notification | null => {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return null;
  }

  const notification = new Notification(title, options);
  return notification;
};

/**
 * Show a pill reminder notification
 * @param pillName The name of the pill
 * @param time The scheduled time for the pill
 * @returns The notification object
 */
export const showPillReminderNotification = (
  pillName: string,
  time: string
): Notification | null => {
  return showNotification(`Time to take: ${pillName}`, {
    body: `Your scheduled medication at ${time}`,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: `pill-reminder-${pillName}`,
    renotify: true,
    requireInteraction: true,
  });
};
