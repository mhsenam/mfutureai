// Service Worker for pill reminder notifications

const CACHE_NAME = 'pill-reminder-v1';

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');

  // Skip the waiting phase
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/favicon.ico',
      ]);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');

  // Claim clients immediately
  self.clients.claim();

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: clearing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Push notification received', event);

  let notificationData = {};

  try {
    notificationData = event.data.json();
  } catch (error) {
    // If the push doesn't contain JSON data, use default
    notificationData = {
      title: 'Pill Reminder',
      body: 'Time to take your medication',
      icon: '/favicon.ico',
      badge: '/favicon.ico'
    };
  }

  const { title, ...options } = notificationData;

  // Show notification
  event.waitUntil(
    self.registration.showNotification(title, {
      ...options,
      vibrate: [100, 50, 100],
      requireInteraction: true,
      actions: [
        {
          action: 'taken',
          title: '✅ Taken'
        },
        {
          action: 'snooze',
          title: '⏰ Snooze 15min'
        }
      ]
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click event', event);

  const notification = event.notification;
  notification.close();

  if (event.action === 'taken') {
    // User marked pill as taken
    event.waitUntil(
      markPillAsTaken(notification.data)
    );
  } else if (event.action === 'snooze') {
    // User snoozed the reminder
    event.waitUntil(
      snoozeReminder(notification.data)
    );
  } else {
    // Main notification was clicked
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Function to mark pill as taken
async function markPillAsTaken(pillData) {
  // Try to get an existing client
  const clients = await self.clients.matchAll({ type: 'window' });

  if (clients.length > 0) {
    // Send message to client
    clients[0].postMessage({
      type: 'PILL_TAKEN',
      data: pillData
    });
  } else {
    // Store in IndexedDB to sync later when app opens
    // This would need IndexedDB implementation
    console.log('No clients available to mark pill as taken');
  }
}

// Function to snooze reminder
async function snoozeReminder(pillData) {
  // Schedule a new notification in 15 minutes
  const clients = await self.clients.matchAll({ type: 'window' });

  if (clients.length > 0) {
    // Send message to client
    clients[0].postMessage({
      type: 'PILL_SNOOZED',
      data: pillData
    });
  } else {
    // Set a timeout to show the notification again in 15 minutes
    setTimeout(() => {
      self.registration.showNotification('Pill Reminder (Snoozed)', {
        body: `Time to take: ${pillData?.pillName || 'your medication'}`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [100, 50, 100],
        requireInteraction: true,
        data: pillData,
        actions: [
          {
            action: 'taken',
            title: '✅ Taken'
          },
          {
            action: 'snooze',
            title: '⏰ Snooze 15min'
          }
        ]
      });
    }, 15 * 60 * 1000); // 15 minutes
  }
} 