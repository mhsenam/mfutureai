const fs = require('fs');
const path = require('path');

// Paths to the files
console.log('Starting script...');
const fitnessTrackerPath = path.join('src', 'components', 'fitness-tracker', 'FitnessTrackerContent.tsx');
const notificationSettingsPath = path.join('src', 'components', 'fitness-tracker', 'NotificationSettings.tsx');

console.log(`Checking if files exist:`);
console.log(`- FitnessTrackerContent.tsx: ${fs.existsSync(fitnessTrackerPath)}`);
console.log(`- NotificationSettings.tsx: ${fs.existsSync(notificationSettingsPath)}`);

// Function to create a backup of a file
function backupFile(filePath) {
  try {
    const backupPath = `${filePath}.backup`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`Created backup at ${backupPath}`);
    return true;
  } catch (error) {
    console.error(`Error creating backup for ${filePath}:`, error);
    return false;
  }
}

// Function to fix problems in FitnessTrackerContent.tsx
function fixFitnessTrackerContent() {
  console.log('\nFixing FitnessTrackerContent.tsx...');

  try {
    // Create backup
    if (!backupFile(fitnessTrackerPath)) {
      return;
    }

    // Read file content
    console.log('Reading file content...');
    const content = fs.readFileSync(fitnessTrackerPath, 'utf8');
    console.log(`File size: ${content.length} bytes`);
    let modifiedContent = content;
    let changesMade = 0;

    // Fix 1: Find and remove duplicate viewBox attributes
    console.log('Checking for duplicate viewBox attributes...');
    const duplicateViewBoxPattern = /(viewBox=["'][^"']*["'])\s+viewBox=["'][^"']*["']/g;
    const dvMatches = modifiedContent.match(duplicateViewBoxPattern);
    if (dvMatches) {
      console.log(`Found ${dvMatches.length} duplicate viewBox attributes`);
      modifiedContent = modifiedContent.replace(duplicateViewBoxPattern, '$1');
      console.log('✓ Fixed duplicate viewBox attributes');
      changesMade++;
    } else {
      console.log('No duplicate viewBox attributes found');
    }

    // Fix 2: Fix the complex Telegram SVG path that might cause parsing issues
    console.log('Checking for complex Telegram SVG paths...');
    const telegramPathPattern = /d=["']M11\.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12.*?["']/g;
    const matches = modifiedContent.match(telegramPathPattern);
    if (matches) {
      console.log(`Found ${matches.length} instance(s) of complex Telegram SVG paths`);
      modifiedContent = modifiedContent.replace(
        telegramPathPattern,
        'd="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"'
      );
      console.log('✓ Simplified complex Telegram SVG paths');
      changesMade++;
    } else {
      console.log('No complex Telegram SVG paths found');
    }

    // Fix 3: Fix mismatched quotes in SVG attributes
    console.log('Checking for mismatched quotes in SVG attributes...');
    const mismatchedQuotesPattern = /([a-zA-Z-]+)=["']([^"']*)(['"'])([^>]*>)/g;
    let mismatchFound = false;
    modifiedContent = modifiedContent.replace(mismatchedQuotesPattern, (match, attr, value, quote, rest) => {
      // If the opening and closing quotes don't match, fix them
      if ((quote === '"' && rest.includes("'")) || (quote === "'" && rest.includes('"'))) {
        mismatchFound = true;
        return `${attr}="${value}"${rest}`;
      }
      return match;
    });

    if (mismatchFound) {
      console.log('✓ Fixed mismatched quotes in SVG attributes');
      changesMade++;
    } else {
      console.log('No mismatched quotes found');
    }

    // Fix 4: Fix unclosed SVG tags
    console.log('Checking for unclosed SVG tags...');
    const unclosedSvgPattern = /<svg[^>]*?>[^<]*?(?!<\/svg>)<(?!\/svg>)/g;
    const unclosedMatches = modifiedContent.match(unclosedSvgPattern);
    if (unclosedMatches) {
      console.log(`Found ${unclosedMatches.length} potentially unclosed SVG tags`);
      console.log('⚠️ Detected potentially unclosed SVG tags - manual inspection recommended');
    } else {
      console.log('No unclosed SVG tags found');
    }

    // Look for specific pattern around line 3079
    console.log('Checking for specific error pattern around line 3079...');
    const lines = modifiedContent.split('\n');
    if (lines.length >= 3080) {
      console.log('Lines around potential error:');
      for (let i = 3075; i < 3085 && i < lines.length; i++) {
        console.log(`Line ${i + 1}: ${lines[i].trim()}`);
      }
    }

    // Write changes back to file
    if (changesMade > 0) {
      console.log(`Writing ${changesMade} fixes back to file...`);
      fs.writeFileSync(fitnessTrackerPath, modifiedContent, 'utf8');
      console.log(`✅ Applied ${changesMade} fixes to FitnessTrackerContent.tsx`);
    } else {
      console.log('No issues found in FitnessTrackerContent.tsx');
    }

  } catch (error) {
    console.error('Error fixing FitnessTrackerContent.tsx:', error);
  }
}

// Function to fix problems in NotificationSettings.tsx
function fixNotificationSettings() {
  console.log('\nFixing NotificationSettings.tsx...');

  try {
    // Create backup
    if (!backupFile(notificationSettingsPath)) {
      return;
    }

    // Read file content
    console.log('Reading file content...');
    const content = fs.readFileSync(notificationSettingsPath, 'utf8');
    console.log(`File size: ${content.length} bytes`);
    let modifiedContent = content;
    let changesMade = 0;

    // Fix 1: Replace apostrophes in text with HTML entities
    console.log('Checking for apostrophes in text...');
    const apostrophePattern = /(\s|>)([^<>'"]*?)'([^<>'"]*?)(\s|<)/g;
    const apostropheMatches = content.match(apostrophePattern);

    if (apostropheMatches) {
      console.log(`Found ${apostropheMatches.length} apostrophes to replace:`);
      apostropheMatches.slice(0, 3).forEach(m => console.log(`  "${m.trim()}"`));
      if (apostropheMatches.length > 3) console.log(`  ... and ${apostropheMatches.length - 3} more`);

      modifiedContent = modifiedContent.replace(apostrophePattern, (match, prefix, before, after, suffix) => {
        return `${prefix}${before}&apos;${after}${suffix}`;
      });
      console.log('✓ Replaced apostrophes with HTML entities');
      changesMade++;
    } else {
      console.log('No apostrophes found');
    }

    // Fix 2: Replace double quotes in text with HTML entities
    console.log('Checking for double quotes in text...');
    const quotePattern = /(\s|>)([^<>'"]*?)"([^<>'"]*?)"([^<>'"]*?)(\s|<)/g;
    const quoteMatches = content.match(quotePattern);

    if (quoteMatches) {
      console.log(`Found ${quoteMatches.length} quotes to replace:`);
      quoteMatches.slice(0, 3).forEach(m => console.log(`  "${m.trim()}"`));
      if (quoteMatches.length > 3) console.log(`  ... and ${quoteMatches.length - 3} more`);

      modifiedContent = modifiedContent.replace(quotePattern, (match, prefix, before, inner, after, suffix) => {
        return `${prefix}${before}&quot;${inner}&quot;${after}${suffix}`;
      });
      console.log('✓ Replaced quotes with HTML entities');
      changesMade++;
    } else {
      console.log('No quotes found');
    }

    // Fix 3: Replace other special characters that may cause issues
    console.log('Checking for specific special character patterns...');
    const replacements = [
      { from: /doesn't/g, to: 'doesn&apos;t' },
      { from: /won't/g, to: 'won&apos;t' },
      { from: /can't/g, to: 'can&apos;t' },
      { from: /it's/g, to: 'it&apos;s' },
      { from: /browser's/g, to: 'browser&apos;s' },
      { from: /website's/g, to: 'website&apos;s' }
    ];

    let replacementsMade = 0;
    replacements.forEach(({ from, to }) => {
      const matches = modifiedContent.match(from);
      if (matches) {
        console.log(`Found ${matches.length} instances of "${from.toString().replace(/\//g, '')}" to replace with "${to}"`);
        modifiedContent = modifiedContent.replace(from, to);
        replacementsMade++;
      }
    });

    if (replacementsMade > 0) {
      console.log(`✓ Fixed ${replacementsMade} specific special character instances`);
      changesMade++;
    } else {
      console.log('No specific special characters found');
    }

    // Write changes back to file
    if (changesMade > 0) {
      console.log(`Writing ${changesMade} fixes back to file...`);
      fs.writeFileSync(notificationSettingsPath, modifiedContent, 'utf8');
      console.log(`✅ Applied ${changesMade} fixes to NotificationSettings.tsx`);
    } else {
      console.log('No issues found in NotificationSettings.tsx');
    }

  } catch (error) {
    console.error('Error fixing NotificationSettings.tsx:', error);
  }
}

// Main function
(function main() {
  console.log('Starting Vercel build error fixes...');

  // Fix FitnessTrackerContent.tsx
  fixFitnessTrackerContent();

  // Fix NotificationSettings.tsx
  fixNotificationSettings();

  console.log('\n✅ Completed all fixes');
})(); 