/**
 * Utility functions for service worker registration and push notifications
 */

// Function to register the service worker
export const registerServiceWorker =
  async (): Promise<ServiceWorkerRegistration | null> => {
    if (!("serviceWorker" in navigator)) {
      console.error("Service Worker not supported in this browser");
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered successfully:", registration);
      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      return null;
    }
  };

// Function to unregister the service worker
export const unregisterServiceWorker = async (): Promise<boolean> => {
  if (!("serviceWorker" in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const result = await registration.unregister();
    return result;
  } catch (error) {
    console.error("Error unregistering Service Worker:", error);
    return false;
  }
};

// Function to check if service worker is registered
export const isServiceWorkerRegistered = async (): Promise<boolean> => {
  if (!("serviceWorker" in navigator)) {
    return false;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    return registrations.length > 0;
  } catch (error) {
    console.error("Error checking Service Worker registration:", error);
    return false;
  }
};

// Add an event listener for the service worker to listen for push events
export const setupServiceWorkerListeners = (): void => {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  navigator.serviceWorker.addEventListener("message", (event) => {
    const { type, data } = event.data;

    if (type === "PILL_REMINDER") {
      // Handle pill reminder message from service worker
      const { pillName, time } = data;
      console.log(`Pill reminder received for ${pillName} at ${time}`);
    }
  });
};
