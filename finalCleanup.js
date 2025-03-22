const fs = require('fs');
const path = require('path');

// File paths
const fitnessTrackerPath = 'src/components/fitness-tracker/FitnessTrackerContent.tsx';
const notificationSettingsPath = 'src/components/fitness-tracker/NotificationSettings.tsx';

// Fix FitnessTrackerContent.tsx
console.log('Fixing FitnessTrackerContent.tsx...');
if (fs.existsSync(fitnessTrackerPath)) {
  let content = fs.readFileSync(fitnessTrackerPath, 'utf8');

  // Fix all SVG issues
  const originalContent = content;

  // Fix malformed SVG tags
  content = content.replace(/<\/\s*<path/g, '<path');
  content = content.replace(/<\/<path/g, '<path');

  // Fix SVG closing tags
  content = content.replace(/<svg([^>]*)>\s*<\/svg>/g, '<svg$1></svg>');

  // Check if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(fitnessTrackerPath, content, 'utf8');
    console.log('Fixed SVG issues in FitnessTrackerContent.tsx');
  } else {
    console.log('No SVG issues found in FitnessTrackerContent.tsx');
  }
} else {
  console.log('FitnessTrackerContent.tsx not found');
}

// Fix NotificationSettings.tsx
console.log('\nFixing NotificationSettings.tsx...');
if (fs.existsSync(notificationSettingsPath)) {
  let content = fs.readFileSync(notificationSettingsPath, 'utf8');
  const originalContent = content;

  // Fix all HTML entity issues

  // Fix apostrophes
  content = content.replace(/([a-zA-Z])\'([a-zA-Z])/g, '$1&apos;$2');
  content = content.replace(/browser\'s/g, 'browser&apos;s');
  content = content.replace(/doesn\'t/g, 'doesn&apos;t');
  content = content.replace(/it\'s/g, 'it&apos;s');

  // Fix quotes in text content
  content = content.replace(/"Notifications"/g, '&quot;Notifications&quot;');
  content = content.replace(/"Block"/g, '&quot;Block&quot;');
  content = content.replace(/"Allow"/g, '&quot;Allow&quot;');

  // Fix attribute quotes
  content = content.replace(/="([^"]*?)"/g, (match, p1) => {
    return `="${p1}"`;
  });

  // Check if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(notificationSettingsPath, content, 'utf8');
    console.log('Fixed HTML entity issues in NotificationSettings.tsx');
  } else {
    console.log('No HTML entity issues found in NotificationSettings.tsx');
  }
} else {
  console.log('NotificationSettings.tsx not found');
}

console.log('\nCleanup completed!'); 