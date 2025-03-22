const fs = require('fs');
const path = require('path');

// Path to the file
const filePath = path.join('src', 'components', 'fitness-tracker', 'FitnessTrackerContent.tsx');
const backupPath = path.join('src', 'components', 'fitness-tracker', 'FitnessTrackerContent_backup2.tsx');

try {
  // Read the file
  console.log('Reading file...');
  const content = fs.readFileSync(filePath, 'utf8');

  // Create backup
  fs.writeFileSync(backupPath, content, 'utf8');
  console.log('Backup created at', backupPath);

  // Fix the known issues
  let modifiedContent = content;
  let changesMade = 0;

  // Fix 1: Remove duplicate viewBox attribute in SVG (around line 3079)
  const duplicateViewBoxRegex = /(viewBox="0 0 20 20"[^>]*?)\s+viewBox="0 0 24 24"/g;
  if (modifiedContent.match(duplicateViewBoxRegex)) {
    modifiedContent = modifiedContent.replace(duplicateViewBoxRegex, '$1');
    console.log('Fixed duplicate viewBox attribute');
    changesMade++;
  }

  // Fix 2: Fix the Telegram SVG path issue around line 3080
  // This is specifically looking for the long complex path that might have issues parsing
  const telegramPathPattern = /d="M11\.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12.*?"/g;
  const matches = modifiedContent.match(telegramPathPattern);
  if (matches) {
    console.log(`Found ${matches.length} instances of complex Telegram SVG paths`);
    modifiedContent = modifiedContent.replace(
      telegramPathPattern,
      'd="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"'
    );
    console.log('Simplified the complex Telegram SVG path');
    changesMade++;
  }

  // Fix 3: Replace Telegram with Browser if it's using the bell icon path
  const bellIconSection = /<path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"[^>]*?><\/path>[^<]*?<\/svg>[^<]*?Telegram/g;
  if (modifiedContent.match(bellIconSection)) {
    modifiedContent = modifiedContent.replace(bellIconSection, (match) => match.replace('Telegram', 'Browser'));
    console.log('Changed "Telegram" text to "Browser" where appropriate');
    changesMade++;
  }

  // Fix 4: Look for any invalid characters in SVG tags that might cause parsing errors
  const svgRegex = /<svg\s+([^>]*)>/g;
  let svgMatch;
  let fixedIllegalChars = false;

  while ((svgMatch = svgRegex.exec(modifiedContent)) !== null) {
    const svgAttrs = svgMatch[1];
    if (svgAttrs.includes('""') || svgAttrs.includes("''")) {
      modifiedContent = modifiedContent.replace(svgAttrs, svgAttrs.replace(/[""'']/g, '"'));
      fixedIllegalChars = true;
    }
  }

  if (fixedIllegalChars) {
    console.log('Fixed illegal characters in SVG attributes');
    changesMade++;
  }

  // Write the modified content back to the file
  fs.writeFileSync(filePath, modifiedContent, 'utf8');

  console.log(`Fixed SVG errors in ${filePath}`);

  // Check if changes were made
  if (changesMade > 0) {
    console.log(`${changesMade} changes applied successfully.`);
  } else {
    console.log('No changes were necessary.');
  }
} catch (error) {
  console.error('Error:', error);
} 