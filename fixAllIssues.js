const fs = require('fs');
const path = require('path');

// File paths
const fitnessTrackerPath = path.join(__dirname, 'src', 'components', 'fitness-tracker', 'FitnessTrackerContent.tsx');
const notificationSettingsPath = path.join(__dirname, 'src', 'components', 'fitness-tracker', 'NotificationSettings.tsx');

// Check if files exist
console.log(`Checking if ${fitnessTrackerPath} exists:`, fs.existsSync(fitnessTrackerPath));
console.log(`Checking if ${notificationSettingsPath} exists:`, fs.existsSync(notificationSettingsPath));

// Create backup function
function createBackup(filePath) {
  const backupPath = `${filePath}.bak`;
  fs.copyFileSync(filePath, backupPath);
  console.log(`Created backup of ${filePath} at ${backupPath}`);
}

// Fix FitnessTrackerContent.tsx
function fixFitnessTrackerContent() {
  if (!fs.existsSync(fitnessTrackerPath)) {
    console.log('FitnessTrackerContent.tsx not found. Skipping.');
    return;
  }

  createBackup(fitnessTrackerPath);

  let content = fs.readFileSync(fitnessTrackerPath, 'utf8');

  // Fix all malformed SVG tags with incorrect path closing
  content = content.replace(/<\/\s*<path/g, '<path');

  // Fix malformed SVG tags if they exist
  content = content.replace(/><\/<path/g, '><path');

  // Ensure proper SVG structure
  content = content.replace(/<svg([^>]*)><\/svg>/g, '<svg$1></svg>');

  // Fix any potential unclosed SVG tags
  content = content.replace(/<svg([^>]*)>(?![\s\S]*?<\/svg>)/g, '<svg$1></svg>');

  const fixedPathCount = (content.match(/<path/g) || []).length;
  console.log(`Fixed ${fixedPathCount} path elements in SVG tags in FitnessTrackerContent.tsx`);

  fs.writeFileSync(fitnessTrackerPath, content, 'utf8');
  console.log('Fixed issues in FitnessTrackerContent.tsx');
}

// Fix NotificationSettings.tsx
function fixNotificationSettings() {
  if (!fs.existsSync(notificationSettingsPath)) {
    console.log('NotificationSettings.tsx not found. Skipping.');
    return;
  }

  createBackup(notificationSettingsPath);

  let content = fs.readFileSync(notificationSettingsPath, 'utf8');

  // Replace apostrophes in text content with HTML entities
  content = content.replace(/(\s|>)([\w\s]*)'([\w\s]*?)(\s|<)/g, '$1$2&apos;$3$4');

  // Replace apostrophes in JSX attributes
  content = content.replace(/='([^']*?)'/g, "='$1'");

  // Replace double quotes in text content with HTML entities
  content = content.replace(/(\s|>)([\w\s]*)"([\w\s]*?)(\s|<)/g, '$1$2&quot;$3$4');

  // Fix specific phrases that commonly cause issues
  const specificReplacements = [
    { search: "browser's", replace: "browser&apos;s" },
    { search: "doesn't", replace: "doesn&apos;t" },
    { search: "it's", replace: "it&apos;s" },
    { search: 'Find "Notifications"', replace: 'Find &quot;Notifications&quot;' },
    { search: 'Change from "Block" to "Allow"', replace: 'Change from &quot;Block&quot; to &quot;Allow&quot;' }
  ];

  specificReplacements.forEach(({ search, replace }) => {
    content = content.replace(new RegExp(search, 'g'), replace);
  });

  fs.writeFileSync(notificationSettingsPath, content, 'utf8');
  console.log('Fixed issues in NotificationSettings.tsx');
}

// Execute fixes
try {
  fixFitnessTrackerContent();
  fixNotificationSettings();
  console.log('All fixes completed successfully!');
} catch (error) {
  console.error('Error applying fixes:', error);
} 