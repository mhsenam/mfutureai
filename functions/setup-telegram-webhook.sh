#!/bin/bash

# Script to set up Telegram webhook for pill reminder notifications
# Usage: ./setup-telegram-webhook.sh <YOUR_BOT_TOKEN> <YOUR_CLOUD_FUNCTION_URL>

# Check if required parameters are provided
if [ $# -lt 2 ]; then
  echo "Usage: $0 <YOUR_BOT_TOKEN> <YOUR_CLOUD_FUNCTION_URL>"
  echo "Example: $0 123456789:ABCdefGHIjklMNOPqrsTUVwxyz https://us-central1-your-project-id.cloudfunctions.net/telegramWebhook"
  exit 1
fi

BOT_TOKEN=$1
WEBHOOK_URL=$2

# Set environment variable for use in cloud functions
echo "Setting TELEGRAM_BOT_TOKEN environment variable..."
firebase functions:config:set telegram.bot_token="$BOT_TOKEN"

# Set the webhook URL in Telegram
echo "Setting up webhook for bot $BOT_TOKEN..."
curl -s "https://api.telegram.org/bot$BOT_TOKEN/setWebhook?url=$WEBHOOK_URL"

echo ""
echo "Verifying webhook setup..."
curl -s "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"

echo ""
echo "Done! Your Telegram bot should now be configured to receive updates through your Cloud Function."
echo "Make sure to deploy your Cloud Function with: firebase deploy --only functions"
