#!/usr/bin/env node

/**
 * Build script for frontend
 * Copies static files and compiles TypeScript to create the dist directory
 */

import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = __dirname;
const distDir = join(rootDir, 'dist');

// Clean and create dist directory
if (existsSync(distDir)) {
  execSync(`rm -rf "${distDir}"`, { stdio: 'inherit' });
}
mkdirSync(distDir, { recursive: true });

console.log('📦 Building frontend...\n');

// Copy index.html
console.log('📄 Copying index.html...');
copyFileSync(join(rootDir, 'index.html'), join(distDir, 'index.html'));

// Copy _redirects
console.log('📄 Copying _redirects...');
copyFileSync(join(rootDir, '_redirects'), join(distDir, '_redirects'));

// Copy styles directory
console.log('🎨 Copying styles...');
const stylesSource = join(rootDir, 'public', 'styles');
const stylesDest = join(distDir, 'styles');
mkdirSync(stylesDest, { recursive: true });

function copyRecursive(src, dest) {
  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

copyRecursive(stylesSource, stylesDest);

// Copy scripts directory (JavaScript files)
console.log('📜 Copying scripts...');
const scriptsSource = join(rootDir, 'src', 'scripts');
const scriptsDest = join(distDir, 'scripts');
mkdirSync(scriptsDest, { recursive: true });

// Copy .js files directly
const scriptFiles = readdirSync(scriptsSource);
for (const file of scriptFiles) {
  if (file.endsWith('.js')) {
    copyFileSync(join(scriptsSource, file), join(scriptsDest, file));
  }
}

// Compile TypeScript files (if tsconfig.json exists)
const tsconfigPath = join(rootDir, 'tsconfig.json');
if (existsSync(tsconfigPath)) {
  console.log('🔨 Compiling TypeScript...');
  try {
    // Use tsc to compile TypeScript files
    // The tsconfig.json already has outDir configured, so we just need to run tsc
    execSync('npx tsc --project tsconfig.json', {
      cwd: rootDir,
      stdio: 'inherit'
    });
    console.log('✅ TypeScript compilation successful');
  } catch (error) {
    console.error('❌ TypeScript compilation failed:', error.message);
    process.exit(1);
  }
} else {
  console.log('ℹ️  No tsconfig.json found, skipping TypeScript compilation');
}

console.log('\n✅ Build complete! Output directory: dist/');
