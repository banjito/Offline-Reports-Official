#!/usr/bin/env node

/**
 * Check .env file configuration
 * Run this to verify your .env file is set up correctly
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

console.log('=== Checking .env file ===\n');

// Check if .env exists
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.log('   Expected location:', envPath);
  console.log('\n💡 Create a .env file with:');
  console.log('   SUPABASE_URL=https://your-project.supabase.co');
  console.log('   SUPABASE_ANON_KEY=your-anon-key-here\n');
  process.exit(1);
}

console.log('✅ .env file exists');

// Read and parse .env
const envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));

console.log(`   Found ${lines.length} configuration lines\n`);

// Check for required variables
const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const foundVars = {};

lines.forEach(line => {
  const [key, ...valueParts] = line.split('=');
  const value = valueParts.join('=').trim();
  
  if (requiredVars.includes(key.trim())) {
    foundVars[key.trim()] = value;
  }
});

// Validate
let allGood = true;

requiredVars.forEach(varName => {
  if (!foundVars[varName]) {
    console.error(`❌ ${varName} not found`);
    allGood = false;
  } else if (foundVars[varName].length === 0) {
    console.error(`❌ ${varName} is empty`);
    allGood = false;
  } else {
    const preview = foundVars[varName].substring(0, 30) + '...';
    console.log(`✅ ${varName}: ${preview}`);
  }
});

console.log();

if (allGood) {
  console.log('🎉 All configuration looks good!');
  console.log('\n💡 Next steps:');
  console.log('   1. Restart the app: npm start');
  console.log('   2. Click the Sync button');
  console.log('   3. Watch the console for sync progress\n');
} else {
  console.log('❌ Configuration has errors');
  console.log('\n💡 Fix your .env file format:');
  console.log('   SUPABASE_URL=https://your-project.supabase.co');
  console.log('   SUPABASE_ANON_KEY=your-anon-key-here');
  console.log('   (No quotes, no spaces around =)\n');
  process.exit(1);
}

