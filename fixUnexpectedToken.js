const fs = require('fs');
const path = require('path');

console.log('Starting unexpected token fix script...');

// Files to check
const files = [
  'src/components/fitness-tracker/FitnessTrackerContent.tsx',
  'src/components/fitness-tracker/NotificationSettings.tsx'
];

// Function to create backup of a file
function createBackup(filePath) {
  const backupPath = `${filePath}.bak.token`;
  try {
    fs.copyFileSync(filePath, backupPath);
    console.log(`Created backup at ${backupPath}`);
    return true;
  } catch (error) {
    console.error(`Failed to create backup of ${filePath}:`, error);
    return false;
  }
}

// Function to fix ternary operators with potential angle bracket issues
function fixTernaryOperators(content) {
  // Pattern 1: value ? "expr1" : value2 ? "expr2" : "expr3"
  // This can be interpreted as comparison with > or <
  let modified = content.replace(
    /([a-zA-Z0-9_\.]+)\s*([<>])\s*([a-zA-Z0-9_\.]+)\s*\?\s*["']([^"']+)["']\s*:\s*([a-zA-Z0-9_\.]+)\s*([<>])\s*([a-zA-Z0-9_\.]+)\s*\?\s*["']([^"']+)["']\s*:\s*["']([^"']+)["']/g,
    '$1 $2 $3 ? "$4" : ($5 $6 $7 ? "$8" : "$9")'
  );

  // Pattern 2: value ? "expr1" : "expr2"
  // Check if the value contains < or >
  modified = modified.replace(
    /([a-zA-Z0-9_\.]+)\s*([<>])\s*([a-zA-Z0-9_\.]+)\s*\?\s*["']([^"']+)["']\s*:\s*["']([^"']+)["']/g,
    '$1 $2 $3 ? "$4" : "$5"'
  );

  return modified;
}

// Process each file
files.forEach(filePath => {
  console.log(`\nChecking ${filePath}...`);

  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  // Read file content
  const content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Create backup
  createBackup(filePath);

  // Apply fixes
  let modifiedContent = fixTernaryOperators(content);

  // Fix specific JSX expression comparisons
  modifiedContent = modifiedContent.replace(/([<>])\s*\?/g, '$1 ?');
  modifiedContent = modifiedContent.replace(/\?\s*([<>])/g, '? $1');
  modifiedContent = modifiedContent.replace(/:\s*([<>])/g, ': $1');

  // Add parentheses around nested ternary expressions
  modifiedContent = modifiedContent.replace(
    /(\?.+?)(\?.+?:)/g,
    '$1($2'
  );
  modifiedContent = modifiedContent.replace(
    /(:.+?)(\?.+?:)/g,
    '$1($2'
  );

  // Specifically look for the weightDiff < 0 ? "lost" : weightDiff > 0 ? "gained" : "maintained" pattern
  modifiedContent = modifiedContent.replace(
    /(weightDiff)\s*<\s*0\s*\?\s*["']lost["']\s*:\s*(weightDiff)\s*>\s*0\s*\?\s*["']gained["']\s*:\s*["']maintained["']/g,
    '$1 < 0 ? "lost" : ($2 > 0 ? "gained" : "maintained")'
  );

  // Check if any changes were made
  if (modifiedContent !== originalContent) {
    fs.writeFileSync(filePath, modifiedContent, 'utf8');
    console.log(`Fixed potential 'Unexpected token' issues in ${filePath}`);
  } else {
    console.log(`No issues found in ${filePath}`);
  }
});

console.log('\nFix script completed!'); 