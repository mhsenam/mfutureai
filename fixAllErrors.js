const fs = require('fs');
const path = require('path');

console.log('Starting comprehensive error fix script...');

// File to fix
const filePath = 'src/components/fitness-tracker/FitnessTrackerContent.tsx';

// Function to create backup of a file
function createBackup(filePath) {
  const backupPath = `${filePath}.bak.errors`;
  try {
    fs.copyFileSync(filePath, backupPath);
    console.log(`Created backup at ${backupPath}`);
    return true;
  } catch (error) {
    console.error(`Failed to create backup of ${filePath}:`, error);
    return false;
  }
}

// Check if file exists
if (!fs.existsSync(filePath)) {
  console.log(`File not found: ${filePath}`);
  process.exit(1);
}

// Create backup
createBackup(filePath);

// Read file content
let content = fs.readFileSync(filePath, 'utf8');
const originalContent = content;

console.log('Fixing ternary expressions and other syntax errors...');

// Fix line 764 - malformed ternary operator with parentheses
content = content.replace(
  /\[name\]: name === "duration" \(\? parseInt\(value\) \|\| 0 : value,/g,
  '[name]: name === "duration" ? parseInt(value) || 0 : value,'
);

// Fix line 1270-1272 - nested ternary with wrong parentheses
content = content.replace(
  /weightDiff < 0 \? "lost" : \(weightDiff > 0 \(\(\? "gained" : "maintained"\),\s+period: daysDiff > 1 \(\? `\${daysDiff} days` : "1 day",/g,
  'weightDiff < 0 ? "lost" : (weightDiff > 0 ? "gained" : "maintained"),\n      period: daysDiff > 1 ? `${daysDiff} days` : "1 day",'
);

// Fix line 2979 - bad ternary syntax with parentheses
content = content.replace(
  /isSaving \(\? "true" : "false"/g,
  'isSaving ? "true" : "false"'
);

// Fix line 2980 - bad ternary syntax with parentheses
content = content.replace(
  /isInitialLoading \(\? "true" : "false"/g,
  'isInitialLoading ? "true" : "false"'
);

// Fix line 2981 - bad ternary syntax with parentheses
content = content.replace(
  /isFetching \(\? "true" : "false"/g,
  'isFetching ? "true" : "false"'
);

// Fix line 2985 - bad ternary syntax with parentheses
content = content.replace(
  /checkNetworkStatus\(\) \(\? "Online" : "Offline"/g,
  'checkNetworkStatus() ? "Online" : "Offline"'
);

// Check if changes were made
if (content !== originalContent) {
  // Write the fixed content back to the file
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed syntax errors in ${filePath}`);
} else {
  console.log(`No changes made to ${filePath}`);
}

console.log('Error fix script completed!'); 