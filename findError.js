const fs = require('fs');
const path = require('path');

// Path to the file
const filePath = path.join('src', 'components', 'fitness-tracker', 'FitnessTrackerContent.tsx');

try {
  // Read the file
  const content = fs.readFileSync(filePath, 'utf8');

  // Split the content into lines
  const lines = content.split('\n');

  // Look at lines around the problem area (lines 3075-3085)
  for (let i = 3075; i < 3085; i++) {
    if (i < lines.length) {
      console.log(`Line ${i + 1}: ${lines[i].trim()}`);
    }
  }

  // Check for any errors in the file
  console.log('\nChecking for potential syntax errors...');

  // Look for unbalanced brackets, quotes, or tags
  const lineToCheck = lines.slice(3075, 3085).join('\n');

  // Check if there are viewBox attributes with inconsistent quotes
  const viewBoxMatches = lineToCheck.match(/viewBox\s*=\s*["'][^"']*["']/g);
  if (viewBoxMatches) {
    console.log('Found viewBox attributes:', viewBoxMatches);
  }

  // Check for unbalanced angle brackets
  const openingAngleBrackets = (lineToCheck.match(/</g) || []).length;
  const closingAngleBrackets = (lineToCheck.match(/>/g) || []).length;

  if (openingAngleBrackets !== closingAngleBrackets) {
    console.log(`Warning: Unbalanced angle brackets. Opening: ${openingAngleBrackets}, Closing: ${closingAngleBrackets}`);
  }

  // Check for incomplete JSX expressions
  const openingCurlyBraces = (lineToCheck.match(/\{/g) || []).length;
  const closingCurlyBraces = (lineToCheck.match(/\}/g) || []).length;

  if (openingCurlyBraces !== closingCurlyBraces) {
    console.log(`Warning: Unbalanced curly braces. Opening: ${openingCurlyBraces}, Closing: ${closingCurlyBraces}`);
  }
} catch (error) {
  console.error('Error:', error);
} 