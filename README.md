# FitAmIn Fitness Tracker

A modern fitness tracking application built with Next.js, Firebase, and Tailwind CSS.

## Features

- User authentication with Firebase Auth
- Track workouts with details like type, duration, and notes
- Track weight over time with a visual calendar
- Real-time data synchronization across devices
- Offline support with data persistence
- Responsive design for mobile and desktop

## Firebase Setup

This application uses Firebase for authentication and data storage. Follow these steps to set up Firebase for your own instance:

### 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Enable Google Analytics if desired (optional)

### 2. Set Up Firebase Authentication

1. In the Firebase Console, go to "Authentication" > "Sign-in method"
2. Enable "Email/Password" authentication
3. Optionally, enable other authentication methods as needed

### 3. Create a Firestore Database

1. In the Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode" and select a location close to your users
4. Click "Enable"

### 4. Set Up Firestore Security Rules

1. In the Firebase Console, go to "Firestore Database" > "Rules"
2. Replace the default rules with the contents of the `firestore.rules` file in this repository
3. Click "Publish"

### 5. Register a Web App

1. In the Firebase Console, click the gear icon next to "Project Overview" and select "Project settings"
2. Scroll down to "Your apps" and click the web icon (</>) to add a web app
3. Register your app with a nickname (e.g., "Fitness Tracker Web")
4. Copy the Firebase configuration object

### 6. Update Configuration in the Project

1. Open `src/lib/firebase.ts` in this project
2. Replace the `firebaseConfig` object with your own configuration from step 5

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID", // Optional
};
```

## Troubleshooting Firebase Connection Issues

If you experience issues with Firebase connectivity:

1. **Check Firebase Console**: Ensure your Firestore database is created and the security rules are properly set.
2. **Verify Authentication**: Make sure authentication is enabled and working correctly.
3. **Check Network**: Ensure your device has a stable internet connection.
4. **Browser Support**: Ensure you're using a modern browser that supports all Firebase features.
5. **Firestore Indexes**: Some queries may require composite indexes. Check the Firebase console for any required index errors.

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Firebase Emulator (Optional)

For local development, you can use the Firebase Emulator Suite:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize Firebase in your project: `firebase init`
4. Select Firestore and Authentication emulators
5. Start the emulators: `firebase emulators:start`
6. Set environment variables in your `.env.local` file:

```
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
NEXT_PUBLIC_FIREBASE_EMULATOR_HOST=localhost
NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT=8080
NEXT_PUBLIC_AUTH_EMULATOR_PORT=9099
```

## License

[MIT](LICENSE)
