# Pill Reminder Cloud Function

This Cloud Function sends email reminders to users when it's time to take their pills.

## Setup Instructions

1. Install the Firebase CLI if you haven't already:

```bash
npm install -g firebase-cli
```

2. Set up your email service credentials:

```bash
firebase functions:config:set email.user="your-email@gmail.com" email.password="your-app-specific-password"
```

Note: For Gmail, you'll need to:

1. Enable 2-Step Verification in your Google Account
2. Generate an App Password:

   - Go to your Google Account settings
   - Navigate to Security
   - Under "Signing in to Google," select App Passwords
   - Generate a new app password for "Mail"
   - Use this password in the Firebase config

3. Deploy the function:

```bash
firebase deploy --only functions
```

## How it works

The function runs every hour and checks:

1. If there are any pill reminders scheduled for the current time
2. Based on the frequency (daily, weekly, or specific date)
3. Sends an email reminder to the user if conditions are met

## Troubleshooting

If emails are not being sent:

1. Check the Firebase Functions logs
2. Verify your email service credentials
3. Make sure the user's email is verified in Firebase Auth
4. Check if the function has the necessary permissions
