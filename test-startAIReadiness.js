// Test script to check for syntax errors in startAIReadiness function
import fs from 'fs';

// Read the routes.ts file
const content = fs.readFileSync('src/api/routes.ts', 'utf8');

// Extract the function from the template string
const functionMatch = content.match(/window\.startAIReadiness\s*=\s*async\s*function\(\)\s*\{([\s\S]*?)\s*\};\s*\}\)\(\);/);

if (!functionMatch) {
  console.error('❌ Function not found');
  process.exit(1);
}

const functionBody = functionMatch[1];
console.log('✅ Function found, length:', functionBody.length);

// Check for common syntax issues
const issues = [];

// Check for unmatched braces
const openBraces = (functionBody.match(/\{/g) || []).length;
const closeBraces = (functionBody.match(/\}/g) || []).length;
if (openBraces !== closeBraces) {
  issues.push(`Unmatched braces: ${openBraces} open, ${closeBraces} close`);
}

// Check for unmatched parentheses
const openParens = (functionBody.match(/\(/g) || []).length;
const closeParens = (functionBody.match(/\)/g) || []).length;
if (openParens !== closeParens) {
  issues.push(`Unmatched parentheses: ${openParens} open, ${closeParens} close`);
}

// Check for incomplete regex patterns
const incompleteRegex = functionBody.match(/\/\^https\?:[^\/]*$/m);
if (incompleteRegex) {
  issues.push('Incomplete regex pattern found');
}

// Check for template literal issues
const templateLiteralIssues = functionBody.match(/`[^`]*$/m);
if (templateLiteralIssues) {
  issues.push('Unclosed template literal found');
}

if (issues.length > 0) {
  console.error('❌ Issues found:');
  issues.forEach(issue => console.error('  -', issue));
  process.exit(1);
} else {
  console.log('✅ No obvious syntax issues found');
  console.log('   Braces:', openBraces, 'open,', closeBraces, 'close');
  console.log('   Parentheses:', openParens, 'open,', closeParens, 'close');
}

