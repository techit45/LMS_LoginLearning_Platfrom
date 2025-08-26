#!/usr/bin/env node

/**
 * P0 CRITICAL FIX: Remove console.log statements from production code
 * This script removes all console.log, console.error, console.warn statements
 * from React components and services
 */

const fs = require('fs');
const path = require('path');

// Directories to process
const directories = [
  path.join(__dirname, '../src/components'),
  path.join(__dirname, '../src/pages'),
  path.join(__dirname, '../src/lib'),
  path.join(__dirname, '../src/contexts'),
  path.join(__dirname, '../src/hooks')
];

// Files to exclude (keep console logs for debugging purposes)
const excludeFiles = [
  'ErrorBoundary.jsx',
  'SystemDiagnosticPage.jsx',
  'TimeTrackingDebug.jsx',
  'TestDrivePage.jsx'
];

// Patterns to remove
const consolePatterns = [
  /console\.log\([^)]*\);?\s*/g,
  /console\.error\([^)]*\);?\s*/g,
  /console\.warn\([^)]*\);?\s*/g,
  /console\.info\([^)]*\);?\s*/g,
  /console\.debug\([^)]*\);?\s*/g,
  /console\.trace\([^)]*\);?\s*/g,
  /console\.group\([^)]*\);?\s*/g,
  /console\.groupEnd\([^)]*\);?\s*/g,
  /console\.table\([^)]*\);?\s*/g,
  /console\.time\([^)]*\);?\s*/g,
  /console\.timeEnd\([^)]*\);?\s*/g
];

// Counter for removed statements
let totalRemoved = 0;
let filesProcessed = 0;
let filesModified = 0;

/**
 * Process a single file
 */
function processFile(filePath) {
  const fileName = path.basename(filePath);
  
  // Skip excluded files
  if (excludeFiles.includes(fileName)) {
    console.log(`⏭️  Skipping: ${fileName} (excluded)`);
    return;
  }
  
  // Only process JS/JSX files
  if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) {
    return;
  }
  
  filesProcessed++;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let removedCount = 0;
    
    // Remove multiline console statements
    content = content.replace(/console\.(log|error|warn|info|debug|trace|group|groupEnd|table|time|timeEnd)\(([\s\S]*?)\);?\s*/g, (match) => {
      // Count opening and closing parentheses to handle multiline
      let openCount = 0;
      let closeCount = 0;
      let endIndex = 0;
      
      for (let i = 0; i < match.length; i++) {
        if (match[i] === '(') openCount++;
        if (match[i] === ')') closeCount++;
        
        if (openCount > 0 && openCount === closeCount) {
          endIndex = i + 1;
          break;
        }
      }
      
      if (endIndex > 0) {
        removedCount++;
        totalRemoved++;
        
        // Check if there's a semicolon after the closing parenthesis
        let fullMatch = match.substring(0, endIndex);
        if (match[endIndex] === ';') {
          fullMatch += ';';
        }
        
        // Return empty string to remove the console statement
        return '';
      }
      
      return match;
    });
    
    // Clean up empty lines (multiple consecutive newlines)
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      filesModified++;
      console.log(`✅ Processed: ${fileName} (removed ${removedCount} console statements)`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

/**
 * Process directory recursively
 */
function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`⚠️  Directory not found: ${dirPath}`);
    return;
  }
  
  const items = fs.readdirSync(dirPath);
  
  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and other build directories
      if (!item.startsWith('.') && item !== 'node_modules' && item !== 'dist' && item !== 'build') {
        processDirectory(fullPath);
      }
    } else if (stat.isFile()) {
      processFile(fullPath);
    }
  });
}

/**
 * Main execution
 */
console.log('🧹 P0 CRITICAL FIX: Removing console.log statements from production code...\n');

directories.forEach(dir => {
  console.log(`📁 Processing directory: ${path.relative(process.cwd(), dir)}`);
  processDirectory(dir);
  console.log('');
});

console.log('📊 Summary:');
console.log(`   Files processed: ${filesProcessed}`);
console.log(`   Files modified: ${filesModified}`);
console.log(`   Console statements removed: ${totalRemoved}`);
console.log('\n✨ Console.log removal complete!');