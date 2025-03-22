const fs = require('fs');
const path = require('path');

// Files to fix
const fitnessTrackerPath = path.join('src', 'components', 'fitness-tracker', 'FitnessTrackerContent.tsx');
const notificationSettingsPath = path.join('src', 'components', 'fitness-tracker', 'NotificationSettings.tsx');

console.log('Checking file existence:');
console.log(`FitnessTrackerContent.tsx exists: ${fs.existsSync(fitnessTrackerPath)}`);
console.log(`NotificationSettings.tsx exists: ${fs.existsSync(notificationSettingsPath)}`);

// Create backups
function createBackup(filePath) {
  const backupPath = `${filePath}.bak`;
  if (fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, backupPath);
    console.log(`Created backup at ${backupPath}`);
    return true;
  } else {
    console.log(`File does not exist: ${filePath}`);
    return false;
  }
}

// Fix FitnessTrackerContent.tsx
function fixFitnessTrackerContent() {
  console.log('\nFixing FitnessTrackerContent.tsx...');

  if (!createBackup(fitnessTrackerPath)) return;

  let content = fs.readFileSync(fitnessTrackerPath, 'utf8');
  let originalContent = content;

  // 1. Fix duplicate viewBox attribute
  content = content.replace(/(viewBox="[^"]*")\s+viewBox="[^"]*"/g, '$1');

  // 2. Fix unclosed SVG tags (careful approach)
  content = content.replace(/<svg\s+([^>]*)>\s*<path/g, '<svg $1><path');

  // 3. Fix the complex Telegram path with problematic characters
  content = content.replace(/d="M11\.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12[^"]*"/g,
    'd="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"');

  // 4. Change any remaining "Telegram" to "Browser" where appropriate
  content = content.replace(/(path d="M10 2a6 6 0 00-6 6v3\.586l-\.707\.707A1 1 0 004 14h12a1 1 0 00\.707-1\.707L16 11\.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"[^>]*>[^<]*<\/svg>[^<]*?)Telegram/g, '$1Browser');

  if (content !== originalContent) {
    fs.writeFileSync(fitnessTrackerPath, content, 'utf8');
    console.log('✅ Fixed issues in FitnessTrackerContent.tsx');
  } else {
    console.log('No changes needed in FitnessTrackerContent.tsx');
  }
}

// Fix NotificationSettings.tsx
function fixNotificationSettings() {
  console.log('\nFixing NotificationSettings.tsx...');

  if (!createBackup(notificationSettingsPath)) return;

  let content = fs.readFileSync(notificationSettingsPath, 'utf8');
  let originalContent = content;

  // Fix apostrophes in text content
  content = content.replace(/(\s|>)([^<>'"]*?)([''])([^<>'"]*?)(\s|<)/g, function (match, prefix, before, quote, after, suffix) {
    return `${prefix}${before}&apos;${after}${suffix}`;
  });

  // Fix double quotes in text content
  content = content.replace(/(\s|>)([^<>'"]*?)([""])([^<>'"]*?)([""])([^<>'"]*?)(\s|<)/g, function (match, prefix, before, openQuote, middle, closeQuote, after, suffix) {
    return `${prefix}${before}&quot;${middle}&quot;${after}${suffix}`;
  });

  // Specific replacements
  const replacements = [
    { from: /doesn't/g, to: 'doesn&apos;t' },
    { from: /won't/g, to: 'won&apos;t' },
    { from: /can't/g, to: 'can&apos;t' },
    { from: /it's/g, to: 'it&apos;s' },
    { from: /browser's/g, to: 'browser&apos;s' },
    { from: /website's/g, to: 'website&apos;s' }
  ];

  replacements.forEach(({ from, to }) => {
    content = content.replace(from, to);
  });

  if (content !== originalContent) {
    fs.writeFileSync(notificationSettingsPath, content, 'utf8');
    console.log('✅ Fixed issues in NotificationSettings.tsx');
  } else {
    console.log('No changes needed in NotificationSettings.tsx');
  }
}

// Main execution
console.log('Starting fixes...');
fixFitnessTrackerContent();
fixNotificationSettings();
console.log('\nAll fixes completed!'); 