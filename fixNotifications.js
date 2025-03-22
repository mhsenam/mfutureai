const fs = require('fs');
const path = require('path');

// Path to the file
const filePath = path.join('src', 'components', 'fitness-tracker', 'FitnessTrackerContent.tsx');

try {
  // Read the file
  let content = fs.readFileSync(filePath, 'utf8');

  // Find the position of the pill.useTelegramNotifications section
  const telegramBadgePattern = /\{pill\.useTelegramNotifications &&\s*pill\.telegramChatId && \(\s*<span[\s\S]*?Browser\s*<\/span>\s*\)\s*\}/;

  // Replace the Telegram badge with an empty string
  content = content.replace(telegramBadgePattern, '');

  // Write the modified content back to the file
  fs.writeFileSync(filePath, content);
  console.log('Successfully removed Telegram badge with Browser text');
} catch (error) {
  console.error('Error:', error);
} 