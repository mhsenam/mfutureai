const fs = require('fs');
const path = require('path');

// Path to the file
const filePath = path.join('src', 'components', 'fitness-tracker', 'FitnessTrackerContent.tsx');
const backupPath = path.join('src', 'components', 'fitness-tracker', 'FitnessTrackerContent_backup.tsx');

// First check if backup exists and restore it
if (fs.existsSync(backupPath)) {
  console.log('Restoring from backup file...');
  fs.copyFileSync(backupPath, filePath);
}

try {
  // Read the file
  let content = fs.readFileSync(filePath, 'utf8');

  // Create a new backup if one doesn't exist
  if (!fs.existsSync(backupPath)) {
    console.log('Creating backup file...');
    fs.writeFileSync(backupPath, content);
  }

  // Split content into lines for more precise editing
  const lines = content.split('\n');
  console.log(`File has ${lines.length} lines total`);

  // Make our confirmed changes
  let changes = 0;

  // 1. Remove "Email" text - around line 3063-3064
  for (let i = 3060; i < 3065; i++) {
    if (i < lines.length && lines[i].includes('Email')) {
      console.log(`Found "Email" at line ${i + 1}: ${lines[i]}`);
      lines[i] = lines[i].replace('Email', '');
      changes++;
    }
  }

  // 2. Change "Telegram" text to "Browser" - line 3082
  if (lines.length > 3082 && lines[3081].includes('Telegram')) {
    console.log(`Found "Telegram" text at line 3082: ${lines[3081]}`);
    lines[3081] = lines[3081].replace('Telegram', 'Browser');
    changes++;
  }

  // Join the lines back together
  content = lines.join('\n');

  // Write the modified content back to the file
  fs.writeFileSync(filePath, content);
  console.log(`File modifications completed! Made ${changes} changes.`);
} catch (error) {
  console.error('Error:', error);
} 